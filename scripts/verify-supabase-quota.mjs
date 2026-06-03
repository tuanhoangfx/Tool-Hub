#!/usr/bin/env node
/**
 * Verify Supabase Quota: catalog + multi-PAT vs workspace scan refs.
 * Usage: node scripts/verify-supabase-quota.mjs [--rescan]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { scanSupabaseWorkspace } from "./lib/supabase-workspace-scan.cjs";

const require = createRequire(import.meta.url);
const { fetchSupabaseQuotaPayload, loadCatalog } = require("./lib/supabase-quota-fetch.cjs");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mapPath = path.join(__dirname, "../public/supabase-workspace-map.json");
const devRoot = path.resolve(__dirname, "..");

const workspace =
  fs.existsSync(mapPath) && !process.argv.includes("--rescan")
    ? JSON.parse(fs.readFileSync(mapPath, "utf8"))
    : scanSupabaseWorkspace();

const workspaceRefs = new Set(workspace.projects.map((p) => p.ref));
const payload = await fetchSupabaseQuotaPayload({ cwd: path.join(__dirname, "..") });
const catalog = loadCatalog(path.resolve(__dirname, ".."), path.resolve(__dirname, ".."));

const apiRefs = new Set(
  (payload.projects ?? []).filter((p) => p.quotaSource !== "catalog" && p.projectRef).map((p) => p.projectRef),
);
const catalogRefs = new Set((catalog.projects ?? []).map((p) => p.ref));
const allQuotaRefs = new Set((payload.projects ?? []).filter((p) => p.projectRef).map((p) => p.projectRef));

const linked = [...workspaceRefs].filter((r) => apiRefs.has(r));
const workspaceOnly = [...workspaceRefs].filter((r) => !allQuotaRefs.has(r));
const catalogOnly = [...catalogRefs].filter((r) => !apiRefs.has(r));
const apiOrphans = [...apiRefs].filter((r) => !catalogRefs.has(r) && !workspaceRefs.has(r));

console.log("=== Supabase Quota verify ===\n");
console.log(`Tokens loaded: ${payload.tokenCount ?? 0}`);
if (payload.tokenStats?.length) {
  for (const t of payload.tokenStats) {
    console.log(`  ${t.label}: ${t.projects ?? 0} projects${t.error ? ` (error: ${t.error})` : ""}`);
  }
}
console.log(`\nCatalog total: ${catalogRefs.size}`);
console.log(`API metrics: ${apiRefs.size}`);
console.log(`Quota panel (merged): ${allQuotaRefs.size}`);
console.log(`Workspace refs: ${workspaceRefs.size}`);
console.log(`Linked workspace↔API: ${linked.length}`);
console.log(`Catalog-only (no PAT): ${catalogOnly.length}`);
console.log(`Workspace-only: ${workspaceOnly.length}`);
console.log(`API orphans: ${apiOrphans.length}\n`);

if (linked.length) {
  console.log("Linked (workspace + live metrics):");
  for (const ref of linked) {
    const ws = workspace.projects.find((p) => p.ref === ref);
    const acc = payload.projects?.find((p) => p.projectRef === ref);
    const tools = [...new Set(ws?.bindings?.map((b) => b.toolCode) ?? [])].join(", ");
    console.log(`  ${ref.slice(0, 8)}… ${acc?.projectName ?? "?"} ← tools: ${tools || "—"}`);
  }
}

if (catalogOnly.length) {
  console.log("\nCatalog-only (listed, no Management API token for account):");
  for (const ref of catalogOnly) {
    const row = catalog.projects.find((p) => p.ref === ref);
    const tools = (row?.tools ?? []).join(", ") || "—";
    console.log(`  ${ref.slice(0, 8)}… ${row?.name ?? "?"} (${row?.accountId}) ← tools: ${tools}`);
  }
}

if (workspaceOnly.length) {
  console.log("\nWorkspace only (env binding, not in catalog/quota):");
  for (const ref of workspaceOnly) {
    const ws = workspace.projects.find((p) => p.ref === ref);
    const tools = [...new Set(ws?.bindings?.map((b) => b.toolCode) ?? [])].join(", ");
    console.log(`  ${ref.slice(0, 8)}… ← tools: ${tools}`);
  }
}

const ok = workspaceOnly.length === 0 && catalogOnly.length <= catalogRefs.size - apiRefs.size;
console.log(
  ok
    ? "\n✓ Workspace refs covered in quota/catalog."
    : "\n⚠ Add SUPABASE_PAT_* for missing accounts to fetch live metrics for all catalog projects.",
);
process.exit(workspaceOnly.length === 0 ? 0 : 1);
