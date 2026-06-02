#!/usr/bin/env node
/**
 * Build static Supabase Quota catalog snapshot for instant first paint (no dev API).
 * Output: public/supabase-quota-catalog.snapshot.json
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const __dirname = dirname(fileURLToPath(import.meta.url));
const hubRoot = join(__dirname, "..");
const require = createRequire(import.meta.url);
const { fetchSupabaseQuotaCatalogPayload } = require("../../scripts/lib/supabase-quota-fetch.cjs");

const payload = fetchSupabaseQuotaCatalogPayload({ cwd: hubRoot });
const outPath = join(hubRoot, "public", "supabase-quota-catalog.snapshot.json");

writeFileSync(outPath, `${JSON.stringify(payload)}\n`, "utf8");
console.log(`Wrote ${outPath} (${payload.projects?.length ?? 0} projects, phase=${payload.metricsPhase})`);
