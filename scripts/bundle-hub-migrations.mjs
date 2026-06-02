#!/usr/bin/env node
/** Concatenate Hub migrations for Dashboard SQL Editor paste. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const hubRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = path.join(hubRoot, "supabase", "APPLY_ALL_HUB.sql");
const files = fs
  .readdirSync(path.join(hubRoot, "supabase/migrations"))
  .filter((f) => /^\d{14}_.+\.sql$/i.test(f))
  .sort();

const parts = files.map((f) => {
  const sql = fs.readFileSync(path.join(hubRoot, "supabase/migrations", f), "utf8");
  return `-- === ${f} ===\n${sql}`;
});

fs.writeFileSync(out, `${parts.join("\n\n")}\n`);
console.log(`Wrote ${files.length} migrations → ${out}`);
console.log("Paste in: https://supabase.com/dashboard/project/fmnrafpzctuhxjaaomzt/sql/new");
