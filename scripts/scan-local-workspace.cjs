const fs = require("node:fs");
const path = require("node:path");
const {
  scanAllRoots,
  mergeRegistryDefault,
  readJson,
} = require("./lib/workspace-scan.cjs");

const p0004Root = path.resolve(__dirname, "..");
const outputPath = path.join(p0004Root, "public", "local-registry.json");
const defaultRegistryPath = path.join(p0004Root, "public", "registry.default.json");
const catalogPath = path.join(p0004Root, "public", "workspace-catalog.json");

const { config, entries: allEntries } = scanAllRoots(undefined, { writeManifest: true });
const projectEntries = allEntries.filter((e) => e.assetKind === "project");

const registry = {
  generatedAt: new Date().toISOString(),
  root: config.devRoot || config.roots.find((r) => r.id === "tool")?.path || "",
  repositories: projectEntries.map(({ workspaceRoot, assetKind, ...repo }) => repo),
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(registry, null, 2)}\n`);
console.log(`Wrote ${projectEntries.length} workspace projects to ${outputPath}`);

const existingDefault = readJson(defaultRegistryPath) || [];
const { merged, addedNew, updatedExisting } = mergeRegistryDefault(existingDefault, projectEntries);
fs.writeFileSync(defaultRegistryPath, `${JSON.stringify(merged, null, 2)}\n`);
console.log(
  `Synced ${defaultRegistryPath} (${merged.length} entries, +${addedNew} new, ~${updatedExisting} updates)`,
);

const catalog = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  roots: config.roots,
  summary: {
    total: allEntries.length,
    projects: allEntries.filter((e) => e.assetKind === "project").length,
    n8n: allEntries.filter((e) => e.assetKind === "n8n-workflow").length,
  },
  entries: allEntries,
};
fs.writeFileSync(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);
console.log(`Wrote workspace catalog (${allEntries.length} entries) to ${catalogPath}`);
