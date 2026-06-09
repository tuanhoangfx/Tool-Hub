#!/usr/bin/env node
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { runMgmtDbQuery } from "../../scripts/lib/supabase-mgmt-query.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const projectRef = process.argv[2] || "fmnrafpzctuhxjaaomzt";
const sql = readFileSync(
  resolve(root, "supabase/migrations/20260608140000_hub_login_id_infix1.sql"),
  "utf8",
);

console.log(`Applying hub login_id infix1 trigger on ${projectRef}…`);
await runMgmtDbQuery(projectRef, sql);
console.log("OK — handle_new_user recognizes @infix1.io.vn");
