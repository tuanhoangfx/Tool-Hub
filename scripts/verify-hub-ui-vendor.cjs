#!/usr/bin/env node
/**
 * Fail if vendor/hub-ui/src/index.ts re-exports missing modules.
 * Run: node scripts/verify-hub-ui-vendor.cjs
 */
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..", "vendor", "hub-ui", "src");
const indexPath = path.join(root, "index.ts");
const text = fs.readFileSync(indexPath, "utf8");
const imports = [...text.matchAll(/from\s+["'](\.\/[^"']+)["']/g)].map((m) => m[1]);

const exts = [".ts", ".tsx", ".js", ".jsx", ""];
const missing = [];

for (const rel of imports) {
  const base = path.join(root, rel.replace(/^\.\//, ""));
  const found = exts.some((ext) => {
    const p = base.endsWith(ext) ? base : base + ext;
    return fs.existsSync(p) && fs.statSync(p).isFile();
  });
  if (!found) missing.push(rel);
}

if (missing.length) {
  console.error("[verify-hub-ui-vendor] Missing modules:\n  " + missing.join("\n  "));
  process.exit(1);
}
console.log(`[verify-hub-ui-vendor] OK — ${imports.length} index imports resolve`);
process.exit(0);
