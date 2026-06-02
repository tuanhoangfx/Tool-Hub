#!/usr/bin/env node
/**
 * Apply all Hub identity SQL migrations via Management API.
 * Usage: node scripts/apply-hub-migrations-all.mjs [projectRef]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runMgmtDbQuery } from "../../scripts/lib/supabase-mgmt-query.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const hubRoot = path.resolve(__dirname, "..");
const projectRef = process.argv[2] || "fmnrafpzctuhxjaaomzt";

const migrationsDir = path.join(hubRoot, "supabase/migrations");
const files = fs
  .readdirSync(migrationsDir)
  .filter((f) => /^\d{14}_.+\.sql$/i.test(f))
  .sort();

console.log(`Applying ${files.length} Hub migrations to ${projectRef}…\n`);

let failed = 0;
for (const file of files) {
  const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
  process.stdout.write(`  ${file} … `);
  try {
    await runMgmtDbQuery(projectRef, sql);
    console.log("OK");
  } catch (e) {
    failed++;
    console.log("FAIL");
    console.error(`    ${e instanceof Error ? e.message : e}\n`);
  }
}

if (failed) {
  console.error(`${failed} migration(s) failed (may be partially applied — check IF NOT EXISTS).`);
  process.exit(1);
}

const check = await runMgmtDbQuery(
  projectRef,
  `select
    to_regclass('public.profiles') is not null as profiles,
    to_regclass('public.hub_tools') is not null as hub_tools,
    to_regclass('public.tool_access') is not null as tool_access;`,
);
console.log("\nVerify:", check);
console.log("Hub migrations done.");
