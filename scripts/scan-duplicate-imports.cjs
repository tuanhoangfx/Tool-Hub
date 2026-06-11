#!/usr/bin/env node
/**
 * Fail if any named import block repeats the same identifier (e.g. MiniBarChart twice).
 */
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..", "src");
const dupes = [];

function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const file = path.join(dir, name);
    const st = fs.statSync(file);
    if (st.isDirectory()) {
      walk(file);
      continue;
    }
    if (!/\.(tsx?|jsx?)$/.test(name)) continue;
    const text = fs.readFileSync(file, "utf8");
    for (const match of text.matchAll(/import\s*\{([^}]+)\}/gs)) {
      const names = match[1]
        .split(",")
        .map((s) => s.trim().split(/\s+as\s+/)[0].trim())
        .filter(Boolean);
      const seen = new Set();
      for (const n of names) {
        if (seen.has(n)) dupes.push({ file, name: n });
        seen.add(n);
      }
    }
  }
}

walk(root);

const registryPath = path.join(root, "lib", "badge-registry.ts");
const registryText = fs.readFileSync(registryPath, "utf8");
if (/from\s+["']\.\/badge-registry-chart["']/.test(registryText)) {
  console.error(
    "badge-registry.ts must not re-export badge-registry-chart (circular import → WORKSPACE_ROLE TDZ)",
  );
  process.exit(1);
}

if (dupes.length === 0) {
  console.log("scan:imports — no duplicate named imports; badge-registry cycle OK");
  process.exit(0);
}

for (const d of dupes) {
  console.error(`${path.relative(root, d.file)}: duplicate import "${d.name}"`);
}
process.exit(1);
