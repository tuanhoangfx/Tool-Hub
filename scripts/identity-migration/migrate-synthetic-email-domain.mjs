#!/usr/bin/env node
/**
 * Migrate Hub synthetic auth emails: @id.hub.x1z10.local → @infix1.io.vn (x1z10 P01).
 * Skips rows where target email already exists.
 *
 * Usage:
 *   node scripts/identity-migration/migrate-synthetic-email-domain.mjs [--dry-run]
 */
import { runDbQuery } from "./db-query.mjs";

const hubRef = process.env.HUB_PROJECT_REF ?? "fmnrafpzctuhxjaaomzt";
const dryRun = process.argv.includes("--dry-run");
const legacySuffix = "@id.hub.x1z10.local";
const newSuffix = "@infix1.io.vn";

async function main() {
  const candidates = await runDbQuery(
    hubRef,
    `select u.id,
            lower(u.email) as email,
            lower(split_part(u.email, '@', 1)) as login_id
     from auth.users u
     where lower(u.email) like '%${legacySuffix}'
     order by u.created_at`,
  );

  if (!candidates?.length) {
    console.log("No legacy synthetic emails to migrate.");
    return;
  }

  console.log(dryRun ? "[DRY RUN]" : "[MIGRATE]", candidates.length, "user(s) with", legacySuffix);

  let migrated = 0;
  let skipped = 0;

  for (const row of candidates) {
    const loginId = row.login_id;
    const newEmail = `${loginId}${newSuffix}`;
    const conflict = await runDbQuery(
      hubRef,
      `select id from auth.users where lower(email) = '${newEmail}' and id <> '${row.id}' limit 1`,
    );

    if (conflict?.length) {
      console.log("SKIP", row.email, "→", newEmail, "(target exists)");
      skipped += 1;
      continue;
    }

    console.log(dryRun ? "WOULD" : "UPDATE", row.email, "→", newEmail);
    if (!dryRun) {
      await runDbQuery(
        hubRef,
        `update auth.users
         set email = '${newEmail}',
             raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb)
               || jsonb_build_object('email', '${newEmail}')
         where id = '${row.id}';

         update public.profiles
         set login_id = coalesce(nullif(trim(login_id), ''), '${loginId}'),
             updated_at = now()
         where id = '${row.id}';`,
      );
    }
    migrated += 1;
  }

  console.log("\nDone.", { migrated, skipped, dryRun });
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
