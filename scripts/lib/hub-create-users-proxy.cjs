"use strict";

const { createClient } = require("@supabase/supabase-js");
const { readSharedEnv, workspaceDevRoot } = require("./read-env-file.cjs");

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

function createHubCreateUsersMiddleware({ cwd = process.cwd(), mode = "development", loadEnv } = {}) {
  return async function hubCreateUsersMiddleware(req, res, next) {
    try {
      if (!req.url?.startsWith("/api/hub/users/create")) return next();
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

      const body = await readBody(req);
      const users = Array.isArray(body.users) ? body.users : [];
      if (!users.length) {
        res.statusCode = 400;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ ok: false, error: "No users in payload" }));
        return;
      }

      const userClient = createClient(url, anon, {
        global: { headers: { Authorization: `Bearer ${userJwt}` } },
      });
      const { data: userData, error: userErr } = await userClient.auth.getUser();
      if (userErr || !userData?.user) {
        res.statusCode = 401;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ ok: false, error: "Invalid session" }));
        return;
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
        return;
      }

      const admin = createClient(url, service);
      const results = [];

      for (const row of users.slice(0, 200)) {
        const email = String(row.email ?? "")
          .trim()
          .toLowerCase();
        const fullName = String(row.fullName ?? row.full_name ?? "").trim() || email;
        const role = cleanRole(row.role);
        const password = String(row.password ?? "").trim() || tempPassword();

        if (!email) {
          results.push({ email: "", ok: false, error: "Missing email" });
          continue;
        }

        const { data, error } = await admin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { full_name: fullName },
        });

        if (error) {
          results.push({ email, ok: false, error: error.message });
          continue;
        }

        const id = data.user?.id;
        if (!id) {
          results.push({ email, ok: false, error: "No user id returned" });
          continue;
        }

        const { error: upsertErr } = await admin.from("profiles").upsert(
          {
            id,
            email,
            full_name: fullName,
            role,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" },
        );

        if (upsertErr) {
          results.push({ email, ok: false, error: upsertErr.message });
          continue;
        }

        results.push({ email, ok: true, id, role, fullName });
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
