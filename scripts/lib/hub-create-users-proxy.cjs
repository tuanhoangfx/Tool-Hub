"use strict";

const { createClient } = require("@supabase/supabase-js");
const { readSharedEnv, workspaceDevRoot } = require("./read-env-file.cjs");
const { hubAuthEmailFromLoginOrEmail, isHubSyntheticEmail } = require("./hub-login.cjs");

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      try {
        const raw = Buffer.concat(chunks).toString("utf8");
        resolve(raw ? JSON.parse(raw) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}

function resolveSupabaseEnv(cwd, mode, loadEnv) {
  const shared = readSharedEnv(cwd);
  let url =
    process.env.VITE_SUPABASE_URL?.trim() ||
    shared.VITE_SUPABASE_URL?.trim() ||
    "";
  let anon =
    process.env.VITE_SUPABASE_ANON_KEY?.trim() ||
    shared.VITE_SUPABASE_ANON_KEY?.trim() ||
    "";
  let service =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    shared.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    "";

  if (loadEnv && (!url || !anon || !service)) {
    const devRoot = workspaceDevRoot(cwd);
    for (const root of [cwd, devRoot]) {
      const loaded = loadEnv(mode, root, "");
      if (!url) url = loaded.VITE_SUPABASE_URL?.trim() || url;
      if (!anon) anon = loaded.VITE_SUPABASE_ANON_KEY?.trim() || anon;
      if (!service) service = loaded.SUPABASE_SERVICE_ROLE_KEY?.trim() || service;
    }
  }

  return { url, anon, service };
}

function cleanRole(value) {
  const v = String(value ?? "").trim().toLowerCase();
  if (v === "admin" || v === "manager") return v;
  return "user";
}

function tempPassword() {
  return `Hub-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
}

function loginIdFromRow(authEmail) {
  if (isHubSyntheticEmail(authEmail)) return authEmail.split("@")[0] ?? "";
  return "";
}

async function requireAdminUser(req, res, { url, anon, service, userJwt }) {
  const userClient = createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${userJwt}` } },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData?.user) {
    res.statusCode = 401;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ ok: false, error: "Invalid session" }));
    return null;
  }

  const { data: profile, error: profErr } = await userClient
    .from("profiles")
    .select("role")
    .eq("id", userData.user.id)
    .maybeSingle();
  if (profErr || cleanRole(profile?.role) !== "admin") {
    res.statusCode = 403;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ ok: false, error: "Admin only" }));
    return null;
  }

  return { userClient, admin: createClient(url, service), actorId: userData.user.id };
}

function createHubCreateUsersMiddleware({ cwd = process.cwd(), mode = "development", loadEnv } = {}) {
  return async function hubCreateUsersMiddleware(req, res, next) {
    try {
      const path = req.url?.split("?")[0] ?? "";
      const isCreate = path === "/api/hub/users/create";
      const isReset = path === "/api/hub/users/reset-password";
      if (!isCreate && !isReset) return next();
      if (req.method !== "POST") {
        res.statusCode = 405;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ ok: false, error: "Method not allowed" }));
        return;
      }

      const auth = req.headers.authorization ?? "";
      if (!auth.startsWith("Bearer ")) {
        res.statusCode = 401;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ ok: false, error: "Sign in required" }));
        return;
      }
      const userJwt = auth.slice(7);

      const { url, anon, service } = resolveSupabaseEnv(cwd, mode, loadEnv);
      if (!url || !anon) {
        res.statusCode = 503;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ ok: false, error: "Supabase not configured" }));
        return;
      }
      if (!service) {
        res.statusCode = 503;
        res.setHeader("Content-Type", "application/json");
        res.end(
          JSON.stringify({
            ok: false,
            error: "SUPABASE_SERVICE_ROLE_KEY missing in .env.shared (admin create users)",
          }),
        );
        return;
      }

      const gate = await requireAdminUser(req, res, { url, anon, service, userJwt });
      if (!gate) return;

      const { admin } = gate;
      const body = await readBody(req);

      if (isReset) {
        const userId = String(body.userId ?? body.user_id ?? "").trim();
        const password = String(body.password ?? "").trim() || tempPassword();
        if (!userId) {
          res.statusCode = 400;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ ok: false, error: "userId required" }));
          return;
        }
        const { data, error } = await admin.auth.admin.updateUserById(userId, { password });
        if (error) {
          res.statusCode = 400;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ ok: false, error: error.message }));
          return;
        }
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.end(
          JSON.stringify({
            ok: true,
            userId: data.user?.id ?? userId,
            password: body.password ? undefined : password,
          }),
        );
        return;
      }

      const users = Array.isArray(body.users) ? body.users : [];
      if (!users.length) {
        res.statusCode = 400;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ ok: false, error: "No users in payload" }));
        return;
      }

      const results = [];

      for (const row of users.slice(0, 200)) {
        const resolved = hubAuthEmailFromLoginOrEmail({
          email: row.email,
          loginId: row.loginId ?? row.login_id,
        });
        if (resolved.error) {
          results.push({ email: "", loginId: "", ok: false, error: resolved.error });
          continue;
        }
        const { authEmail, loginId } = resolved;
        const fullName =
          String(row.fullName ?? row.full_name ?? "").trim() ||
          loginId ||
          authEmail.split("@")[0];
        const role = cleanRole(row.role);
        const password = String(row.password ?? "").trim() || tempPassword();
        const contactEmail = String(row.contactEmail ?? row.contact_email ?? row.email ?? "")
          .trim()
          .toLowerCase();
        const profileEmail =
          contactEmail && !isHubSyntheticEmail(contactEmail) ? contactEmail : null;

        const { data, error } = await admin.auth.admin.createUser({
          email: authEmail,
          password,
          email_confirm: true,
          user_metadata: {
            full_name: fullName,
            login_id: loginId ?? undefined,
            contact_email: profileEmail ?? undefined,
          },
        });

        if (error) {
          results.push({
            email: profileEmail ?? authEmail,
            loginId: loginId ?? "",
            ok: false,
            error: error.message,
          });
          continue;
        }

        const id = data.user?.id;
        if (!id) {
          results.push({
            email: profileEmail ?? authEmail,
            loginId: loginId ?? "",
            ok: false,
            error: "No user id returned",
          });
          continue;
        }

        const profileRow = {
          id,
          login_id: loginId,
          email: profileEmail ?? (loginId ? null : authEmail),
          contact_email: profileEmail,
          full_name: fullName,
          role,
          updated_at: new Date().toISOString(),
        };

        const { error: upsertErr } = await admin.from("profiles").upsert(profileRow, { onConflict: "id" });

        if (upsertErr) {
          results.push({
            email: profileEmail ?? authEmail,
            loginId: loginId ?? "",
            ok: false,
            error: upsertErr.message,
          });
          continue;
        }

        results.push({
          email: profileEmail ?? authEmail,
          loginId: loginId ?? loginIdFromRow(authEmail),
          ok: true,
          id,
          role,
          fullName,
        });
      }

      const created = results.filter((r) => r.ok).length;
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ ok: created > 0, created, results }));
    } catch (e) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(
        JSON.stringify({ ok: false, error: e instanceof Error ? e.message : String(e) }),
      );
    }
  };
}

module.exports = { createHubCreateUsersMiddleware };
