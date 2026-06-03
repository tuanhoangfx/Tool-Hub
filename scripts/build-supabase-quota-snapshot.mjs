#!/usr/bin/env node
/**
 * Build static Supabase Quota catalog snapshot for instant first paint (no dev API).
 * Output: public/supabase-quota-catalog.snapshot.json
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const __dirname = dirname(fileURLToPath(import.meta.url));
const hubRoot = join(__dirname, "..");
const outPath = join(hubRoot, "public", "supabase-quota-catalog.snapshot.json");
const workspaceLib = join(hubRoot, "..", "..", "scripts", "lib", "supabase-quota-fetch.cjs");
const localLib = join(__dirname, "lib", "supabase-quota-fetch.cjs");
const libPath = [localLib, workspaceLib].find((p) => existsSync(p));

if (!libPath) {
  if (existsSync(outPath)) {
    console.log(`Using committed snapshot at ${outPath}`);
    process.exit(0);
  }
  throw new Error(
    "supabase-quota-fetch.cjs not found (standalone deploy) and no public/supabase-quota-catalog.snapshot.json",
  );
}

const require = createRequire(import.meta.url);
const { fetchSupabaseQuotaCatalogPayload } = require(libPath);
const payload = fetchSupabaseQuotaCatalogPayload({ cwd: hubRoot });

let previousCount = 0;
if (existsSync(outPath)) {
  try {
    const prev = JSON.parse(readFileSync(outPath, "utf8"));
    previousCount = prev.projects?.length ?? 0;
  } catch {
    previousCount = 0;
  }
}

const nextCount = payload.projects?.length ?? 0;
if (previousCount > 0 && nextCount < previousCount) {
  console.log(
    `Keeping committed snapshot (${previousCount} projects); regenerated payload had ${nextCount} projects`,
  );
  process.exit(0);
}

writeFileSync(outPath, `${JSON.stringify(payload)}\n`, "utf8");
console.log(`Wrote ${outPath} (${nextCount} projects, phase=${payload.metricsPhase})`);
