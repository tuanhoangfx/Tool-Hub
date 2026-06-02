#!/usr/bin/env node
/**
 * Phase 2: Import export JSON into Hub (x1z10 P01).
 * Requires HUB service role in P0004 .env.local:
 *   SUPABASE_SERVICE_ROLE_KEY=...
 */
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { loadMigrationEnv } from "./load-env.mjs";
import { fetchServiceRole } from "./fetch-service-role.mjs";

const env = loadMigrationEnv();
const dryRun = process.argv.includes("--dry-run");
const exportFile =
  process.argv.find((a) => a.endsWith(".json")) ??
  path.join(env.exportDir, `databox-identity-${env.sourceRef}.json`);

let hubServiceKey = env.hubServiceKey;
const hubUrl = env.hubUrl;
if (!hubServiceKey) {
  console.log("Fetching Hub service_role via Management API…");
  hubServiceKey = await fetchServiceRole("fmnrafpzctuhxjaaomzt");
}
if (!hubUrl || !hubServiceKey) {
  console.error("Missing Hub VITE_SUPABASE_URL or service role");
  process.exit(1);
}

if (!fs.existsSync(exportFile)) {
  console.error("Export file not found:", exportFile, "\nRun: pnpm identity:export");
  process.exit(1);
}

const payload = JSON.parse(fs.readFileSync(exportFile, "utf8"));
const hub = createClient(hubUrl, hubServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function cleanRole(role) {
  if (role === "admin" || role === "manager") return role;
  if (role === "user" || role === "employee") return "user";
  return "user";
}

async function findHubUserByEmail(email) {
  const normalized = email.trim().toLowerCase();
  let page = 1;
  for (;;) {
    const { data, error } = await hub.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const hit = (data?.users ?? []).find((u) => u.email?.toLowerCase() === normalized);
    if (hit) return hit;
    if ((data?.users?.length ?? 0) < 200) break;
    page += 1;
  }
  return null;
}

async function main() {
  console.log(dryRun ? "[DRY RUN]" : "[IMPORT]", exportFile, "→", env.hubUrl);

  const userIdMap = new Map();
  const projectIdMap = new Map();
  const report = { usersCreated: 0, usersMapped: 0, profilesUpserted: 0, projects: 0, members: 0, skippedUsers: 0, errors: [] };

  for (const row of payload.users) {
    if (!row.email) {
      report.skippedUsers += 1;
      continue;
    }
    try {
      let hubUser = await findHubUserByEmail(row.email);
      if (!hubUser && !dryRun) {
        const { data, error } = await hub.auth.admin.createUser({
          email: row.email,
          email_confirm: true,
          user_metadata: { full_name: row.full_name },
          app_metadata: { role: cleanRole(row.role) },
        });
        if (error) throw error;
        hubUser = data.user;
        report.usersCreated += 1;
      } else if (hubUser) {
        report.usersMapped += 1;
      }

      if (!hubUser) {
        console.log("  [dry] would create user", row.email);
        userIdMap.set(row.legacy_user_id, row.legacy_user_id);
        continue;
      }

      userIdMap.set(row.legacy_user_id, hubUser.id);

      if (!dryRun) {
        const { error: profileErr } = await hub.from("profiles").upsert(
          {
            id: hubUser.id,
            email: row.email,
            full_name: row.full_name,
            role: cleanRole(row.role),
            avatar_url: row.avatar_url,
            last_sign_in_at: row.last_sign_in_at,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" },
        );
        if (profileErr) throw profileErr;
        report.profilesUpserted += 1;

        await hub.from("legacy_user_map").upsert(
          {
            source_ref: payload.sourceRef,
            legacy_user_id: row.legacy_user_id,
            hub_user_id: hubUser.id,
            email: row.email,
          },
          { onConflict: "source_ref,legacy_user_id" },
        );
      }
    } catch (e) {
      report.errors.push({ email: row.email, error: String(e.message ?? e) });
    }
  }

  for (const pr of payload.projects ?? []) {
    const legacyId = pr.id;
    if (legacyId == null) continue;
    try {
      if (dryRun) {
        projectIdMap.set(legacyId, legacyId);
        report.projects += 1;
        continue;
      }
      const { data, error } = await hub
        .from("projects")
        .upsert(
          {
            name: pr.name ?? `Project ${legacyId}`,
            color: pr.color ?? null,
            created_by: userIdMap.get(pr.created_by) ?? pr.created_by ?? null,
            source_ref: payload.sourceRef,
            legacy_project_id: legacyId,
            created_at: pr.created_at ?? new Date().toISOString(),
          },
          { onConflict: "source_ref,legacy_project_id" },
        )
        .select("id")
        .single();
      if (error) throw error;
      projectIdMap.set(legacyId, data.id);
      await hub.from("legacy_project_map").upsert(
        {
          source_ref: payload.sourceRef,
          legacy_project_id: legacyId,
          hub_project_id: data.id,
        },
        { onConflict: "source_ref,legacy_project_id" },
      );
      report.projects += 1;
    } catch (e) {
      report.errors.push({ project: legacyId, error: String(e.message ?? e) });
    }
  }

  for (const m of payload.projectMembers ?? []) {
    const hubUserId = userIdMap.get(m.user_id);
    const hubProjectId = projectIdMap.get(m.project_id);
    if (!hubUserId || !hubProjectId) continue;
    try {
      if (dryRun) {
        report.members += 1;
        continue;
      }
      const { error } = await hub.from("project_members").upsert(
        {
          project_id: hubProjectId,
          user_id: hubUserId,
          created_at: m.created_at ?? new Date().toISOString(),
        },
        { onConflict: "project_id,user_id" },
      );
      if (error) throw error;
      report.members += 1;
    } catch (e) {
      report.errors.push({ member: `${m.project_id}:${m.user_id}`, error: String(e.message ?? e) });
    }
  }

  console.log(JSON.stringify(report, null, 2));
  if (report.errors.length) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
