/**
 * Scan workspace Cursor rules/skills → public/agent-manifest.json (read-only Agent tab).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const hubRoot = path.resolve(__dirname, "..");
const workspaceRoot = path.resolve(hubRoot, "../..");
const outFile = path.join(hubRoot, "public", "agent-manifest.json");

function slugId(relPath) {
  return relPath.replace(/\\/g, "/").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
}

function parseMdcFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};
  const fm = {};
  for (const line of match[1].split(/\r?\n/)) {
    const m = line.match(/^([\w-]+):\s*(.*)$/);
    if (!m) continue;
    const key = m[1];
    let val = m[2].trim();
    if (val === "true") val = true;
    else if (val === "false") val = false;
    fm[key] = val;
  }
  return fm;
}

function parseSkillFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};
  const fm = {};
  for (const line of match[1].split(/\r?\n/)) {
    const m = line.match(/^([\w-]+):\s*(.+)$/);
    if (m) fm[m[1]] = m[2].trim();
  }
  return fm;
}

function walkFiles(dir, ext, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walkFiles(full, ext, out);
    else if (ent.isFile() && ent.name.endsWith(ext)) out.push(full);
  }
  return out;
}

function relWorkspace(abs) {
  return path.relative(workspaceRoot, abs).replace(/\//g, "\\");
}

function addItem(items, entry) {
  items.push(entry);
}

function scanRules(items) {
  const rulesDir = path.join(workspaceRoot, ".cursor", "rules");
  for (const file of walkFiles(rulesDir, ".mdc")) {
    const raw = fs.readFileSync(file, "utf8");
    const fm = parseMdcFrontmatter(raw);
    const rel = relWorkspace(file);
    const name = path.basename(file, ".mdc");
    const body = raw.replace(/^---[\s\S]*?---\r?\n?/, "").trim();
    addItem(items, {
      id: slugId(rel),
      kind: "rule",
      name,
      path: rel,
      scope: "workspace",
      alwaysApply: fm.alwaysApply === true,
      agentRequestable: fm.alwaysApply !== true,
      summary: String(fm.description || body.split("\n").find((l) => l.trim())?.trim() || name).slice(0, 240),
      bodyPreview: body.slice(0, 1200),
      lines: body.split(/\r?\n/).length,
      updatedAt: fs.statSync(file).mtime.toISOString(),
      tags: ["rule", path.dirname(rel).split("\\").pop() || "rules"],
    });
  }
}

function scanSkills(items, skillsDir, scope) {
  if (!fs.existsSync(skillsDir)) return;
  for (const file of walkFiles(skillsDir, ".md")) {
    if (!file.endsWith("SKILL.md")) continue;
    const raw = fs.readFileSync(file, "utf8");
    const fm = parseSkillFrontmatter(raw);
    const rel = relWorkspace(file);
    const folder = path.basename(path.dirname(file));
    const body = raw.replace(/^---[\s\S]*?---\r?\n?/, "").trim();
    addItem(items, {
      id: slugId(rel),
      kind: "skill",
      name: folder,
      path: rel,
      scope,
      trigger: fm.description || "",
      summary: String(fm.description || body.slice(0, 200)).slice(0, 240),
      bodyPreview: body.slice(0, 1200),
      lines: body.split(/\r?\n/).length,
      updatedAt: fs.statSync(file).mtime.toISOString(),
      tags: ["skill", scope],
    });
  }
}

function scanHubContracts(items) {
  const targets = [
    path.join(workspaceRoot, "Tool", "packages", "hub-load", "src", "index.ts"),
    path.join(hubRoot, "src", "lib", "hub-catalog-client-cache.ts"),
    path.join(hubRoot, "src", "lib", "hub-background-prefetch.ts"),
  ];
  for (const file of targets) {
    if (!fs.existsSync(file)) continue;
    const raw = fs.readFileSync(file, "utf8");
    const rel = relWorkspace(file);
    const name = path.basename(file);
    addItem(items, {
      id: slugId(rel),
      kind: rel.includes("hub-load") ? "contract" : "file",
      name,
      path: rel,
      scope: rel.includes("packages") ? "package" : "workspace",
      summary: `Hub load / catalog reference: ${name}`,
      bodyPreview: raw.slice(0, 1200),
      lines: raw.split(/\r?\n/).length,
      updatedAt: fs.statSync(file).mtime.toISOString(),
      tags: ["hub-load", "p0004"],
    });
  }
}

function main() {
  const items = [];
  scanRules(items);
  scanSkills(items, path.join(workspaceRoot, ".cursor", "skills"), "workspace");
  scanHubContracts(items);

  const manifest = {
    generatedAt: new Date().toISOString(),
    workspaceRoot,
    items: items.sort((a, b) => a.kind.localeCompare(b.kind) || a.name.localeCompare(b.name)),
  };

  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, JSON.stringify(manifest, null, 2), "utf8");
  console.log(`OK  agent-manifest.json (${items.length} items)`);
}

main();
