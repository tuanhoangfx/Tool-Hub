#!/usr/bin/env node
/**
 * Merge auth.users that share the same email on Hub (x1z10 P01).
 * Reassigns project_members, activity_logs, legacy_user_map; deletes duplicate profiles + auth users.
 */
import { createClient } from "@supabase/supabase-js";
import { runDbQuery } from "./db-query.mjs";
import { fetchServiceRole } from "./fetch-service-role.mjs";
import { loadMigrationEnv } from "./load-env.mjs";

const env = loadMigrationEnv();
const dryRun = process.argv.includes("--dry-run");
const hubRef = "fmnrafpzctuhxjaaomzt";

const ROLE_RANK = { admin: 3, manager: 2, user: 2, employee: 1 };

function scoreUser(row) {
  const role = row.role === "employee" ? "user" : row.role;
  const roleScore = ROLE_RANK[role] ?? 1;
  const activeMs = row.last_sign_in_at ? new Date(row.last_sign_in_at).getTime() : 0;
  return roleScore * 1e15 + activeMs;
}

function sqlUuidList(ids) {
  return ids.map((id) => `'${id}'`).join(",");
}

async function main() {
  const users = await runDbQuery(
    hubRef,
    `select u.id, lower(trim(u.email)) as email, u.created_at, u.last_sign_in_at,
      coalesce(nullif(p.role, ''), u.raw_app_meta_data ->> 'role', 'user') as role
     from auth.users u
     left join public.profiles p on p.id = u.id
     where u.email is not null and trim(u.email) <> ''`,
  );

  const byEmail = new Map();
  for (const row of users) {
    if (!row.email) continue;
    const list = byEmail.get(row.email) ?? [];
    list.push(row);
    byEmail.set(row.email, list);
  }

  const groups = [...byEmail.entries()].filter(([, list]) => list.length > 1);
  if (!groups.length) {
    console.log("No duplicate emails in auth.users — nothing to merge.");
    return;
  }

  console.log(dryRun ? "[DRY RUN]" : "[MERGE]", groups.length, "duplicate email group(s)");

  const hubKey = await fetchServiceRole(hubRef);
  const hub = createClient(env.hubUrl, hubKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const report = { merged: 0, deleted: 0, errors: [] };

  for (const [email, list] of groups) {
    const sorted = [...list].sort((a, b) => scoreUser(b) - scoreUser(a));
    const keeper = sorted[0];
    const dupes = sorted.slice(1).map((r) => r.id);
    console.log(`\n${email}: keep ${keeper.id} (${keeper.role}), remove ${dupes.length}`);

    if (dryRun) {
      report.merged += 1;
      report.deleted += dupes.length;
      continue;
    }

    try {
      const inList = sqlUuidList(dupes);
      await runDbQuery(
        hubRef,
        `update public.project_members set user_id = '${keeper.id}'
         where user_id in (${inList})
         and not exists (
           select 1 from public.project_members pm2
           where pm2.project_id = project_members.project_id and pm2.user_id = '${keeper.id}'
         )`,
      );
      await runDbQuery(
        hubRef,
        `delete from public.project_members where user_id in (${inList})`,
      );
      await runDbQuery(
        hubRef,
        `update public.activity_logs set user_id = '${keeper.id}' where user_id in (${inList})`,
      );
      await runDbQuery(
        hubRef,
        `update public.legacy_user_map set hub_user_id = '${keeper.id}' where hub_user_id in (${inList})`,
      );
      await runDbQuery(
        hubRef,
        `update public.projects set created_by = '${keeper.id}'
         where created_by in (${inList})`,
      );
      await runDbQuery(hubRef, `delete from public.profiles where id in (${inList})`);

      for (const dupeId of dupes) {
        const { error } = await hub.auth.admin.deleteUser(dupeId);
        if (error) throw new Error(`${dupeId}: ${error.message}`);
        report.deleted += 1;
      }
      report.merged += 1;
    } catch (e) {
      report.errors.push({ email, error: String(e.message ?? e) });
      console.error("  error:", e.message ?? e);
    }
  }

  console.log("\n", JSON.stringify(report, null, 2));
  if (report.errors.length) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
