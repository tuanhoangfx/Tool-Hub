#!/usr/bin/env node
/**
 * Copy workspace Supabase project catalog into Hub public/ for standalone builds.
 * Source: E:\Dev\supabase-projects.catalog.json
 */
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const hubRoot = path.resolve(__dirname, "..");
const src = path.resolve(hubRoot, "../..", "supabase-projects.catalog.json");
const dst = path.join(hubRoot, "public", "supabase-projects.catalog.json");

function sha256(filePath) {
  if (!fs.existsSync(filePath)) return "";
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

if (!fs.existsSync(src)) {
  console.error(`Missing workspace catalog: ${src}`);
  process.exit(1);
}

const before = sha256(dst);
fs.mkdirSync(path.dirname(dst), { recursive: true });
fs.copyFileSync(src, dst);
const after = sha256(dst);

if (before === after) {
  console.log(`OK  supabase-projects.catalog.json (unchanged)`);
} else {
  console.log(`OK  synced supabase-projects.catalog.json ← ${src}`);
}
