#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runDbQuery } from "./identity-migration/db-query.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const projectRef = process.env.HUB_PROJECT_REF ?? "fmnrafpzctuhxjaaomzt";
const migration = path.join(root, "supabase/migrations/20260603120000_hub_login_id.sql");

async function main() {
  const sql = fs.readFileSync(migration, "utf8");
  console.log("Applying", path.basename(migration), "on", projectRef, "...");
  await runDbQuery(projectRef, sql);
  console.log("OK: migration applied");

  const cols = await runDbQuery(
    projectRef,
    `select column_name from information_schema.columns
     where table_schema='public' and table_name='profiles'
       and column_name in ('login_id','contact_email')
     order by 1;`,
  );
  console.log("Columns:", cols);

  const backfill = await runDbQuery(
    projectRef,
    `update public.profiles p
     set login_id = lower(split_part(u.email, '@', 1)),
         updated_at = now()
     from auth.users u
     where p.id = u.id
       and (lower(u.email) like '%@infix1.io.vn' or lower(u.email) like '%@id.hub.x1z10.local')
       and (p.login_id is null or p.login_id = '');
     select count(*)::int as profiles_with_login_id from public.profiles where login_id is not null;`,
  );
  console.log("Backfill:", backfill);
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
