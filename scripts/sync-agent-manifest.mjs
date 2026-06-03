/**
 * Scan workspace Cursor rules/skills/commands + Hub UI stack → public/agent-manifest.json
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const hubRoot = path.resolve(__dirname, "..");
const devRoot = path.resolve(hubRoot, "../..");
const toolRoot = path.join(devRoot, "Tool");
const cursorRoot = devRoot;
const outFile = path.join(hubRoot, "public", "agent-manifest.json");

const HUB_UI_COMMAND_FILES = new Set([
  "hub-ui.md",
  "sync-hub-ui.md",
  "verify-browser.md",
  "design-5.md",
]);

const HUB_UI_SCRIPT_NAMES = new Set([
  "hub-ui-stack.cjs",
  "sync-hub-ui-screen.cjs",
  "sync-hub-ui-vendor.cjs",
  "sync-hub-theme-from-p0004.cjs",
]);

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
  return path.relative(devRoot, abs).replace(/\//g, "\\");
}

function addItem(items, entry) {
  items.push(entry);
}

function hubUiTags(extra = []) {
  return ["hub-ui", ...extra];
}

function scanRules(items) {
  const rulesDir = path.join(cursorRoot, ".cursor", "rules");
  for (const file of walkFiles(rulesDir, ".mdc")) {
    const raw = fs.readFileSync(file, "utf8");
    const fm = parseMdcFrontmatter(raw);
    const rel = relWorkspace(file);
    const name = path.basename(file, ".mdc");
    const body = raw.replace(/^---[\s\S]*?---\r?\n?/, "").trim();
    const isHubUi = name.includes("hub-ui") || name.includes("p0004-hub");
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
      tags: isHubUi ? hubUiTags(["rule"]) : ["rule", path.dirname(rel).split("\\").pop() || "rules"],
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
    const isHubUi =
      folder.includes("sync-p0004") ||
      folder.includes("p0004-ui") ||
      String(fm.description || "").toLowerCase().includes("p0004") ||
      String(fm.description || "").toLowerCase().includes("hub ui");
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
      tags: isHubUi ? hubUiTags(["skill"]) : ["skill", scope],
    });
  }
  const ref = path.join(skillsDir, "sync-p0004-ui-shell", "reference.md");
  if (fs.existsSync(ref)) {
    const raw = fs.readFileSync(ref, "utf8");
    addItem(items, {
      id: slugId(relWorkspace(ref)),
      kind: "skill",
      name: "sync-p0004-ui-shell/reference",
      path: relWorkspace(ref),
      scope,
      trigger: "Hub UI file manifest + Clone 100%",
      summary: "P0004 UI clone checklist and path manifest",
      bodyPreview: raw.slice(0, 1200),
      lines: raw.split(/\r?\n/).length,
      updatedAt: fs.statSync(ref).mtime.toISOString(),
      tags: hubUiTags(["reference"]),
    });
  }
}

function scanCommands(items) {
  const cmdDir = path.join(cursorRoot, ".cursor", "commands");
  if (!fs.existsSync(cmdDir)) return;
  for (const ent of fs.readdirSync(cmdDir, { withFileTypes: true })) {
    if (!ent.isFile() || !ent.name.endsWith(".md")) continue;
    const file = path.join(cmdDir, ent.name);
    const raw = fs.readFileSync(file, "utf8");
    const rel = relWorkspace(file);
    const name = ent.name.replace(/\.md$/, "");
    const isHubUi = HUB_UI_COMMAND_FILES.has(ent.name) || name.includes("hub");
    if (!isHubUi && !raw.toLowerCase().includes("hub-ui") && !raw.toLowerCase().includes("p0004")) continue;
    addItem(items, {
      id: slugId(rel),
      kind: "command",
      name: `/${name}`,
      path: rel,
      scope: "workspace",
      commandId: name,
      agentRequestable: true,
      summary: raw.split("\n").find((l) => l.startsWith("#"))?.replace(/^#+\s*/, "").slice(0, 240) || `Cursor /${name}`,
      bodyPreview: raw.slice(0, 1200),
      lines: raw.split(/\r?\n/).length,
      updatedAt: fs.statSync(file).mtime.toISOString(),
      tags: hubUiTags(["command"]),
    });
  }
}

function scanHubScripts(items) {
  const scriptsDir = path.join(toolRoot, "scripts");
  if (!fs.existsSync(scriptsDir)) return;
  for (const ent of fs.readdirSync(scriptsDir, { withFileTypes: true })) {
    if (!ent.isFile() || !HUB_UI_SCRIPT_NAMES.has(ent.name)) continue;
    const file = path.join(scriptsDir, ent.name);
    const raw = fs.readFileSync(file, "utf8");
    const rel = relWorkspace(file);
    addItem(items, {
      id: slugId(rel),
      kind: "script",
      name: ent.name,
      path: rel,
      scope: "workspace",
      agentRequestable: true,
      summary: `Hub UI script: ${ent.name}`,
      bodyPreview: raw.slice(0, 1200),
      lines: raw.split(/\r?\n/).length,
      updatedAt: fs.statSync(file).mtime.toISOString(),
      tags: hubUiTags(["script"]),
    });
  }
}

function scanHubKeyboardDoc(items) {
  const doc = path.join(hubRoot, "docs", "HUB-KEYBOARD-SHORTCUTS.md");
  if (!fs.existsSync(doc)) return;
  const raw = fs.readFileSync(doc, "utf8");
  addItem(items, {
    id: "hub-keyboard-shortcuts",
    kind: "contract",
    name: "Hub keyboard shortcuts",
    path: relWorkspace(doc),
    scope: "workspace",
    agentRequestable: true,
    summary: "F Search · N New · E Edit selection · Esc close modal",
    bodyPreview: raw.slice(0, 1200),
    lines: raw.split(/\r?\n/).length,
    updatedAt: fs.statSync(doc).mtime.toISOString(),
    tags: hubUiTags(["keyboard", "p0004"]),
  });
}

function scanAgentsCatalog(items) {
  const agentsMd = path.join(hubRoot, "AGENTS.md");
  if (!fs.existsSync(agentsMd)) return;
  const raw = fs.readFileSync(agentsMd, "utf8");
  const rel = relWorkspace(agentsMd);
  addItem(items, {
    id: "p0004-agents-md",
    kind: "contract",
    name: "AGENTS.md",
    path: rel,
    scope: "workspace",
    agentRequestable: true,
    summary: "P0004 Hub UI + agent stack catalog; /hub-ui bundle entry",
    bodyPreview: raw.slice(0, 1200),
    lines: raw.split(/\r?\n/).length,
    updatedAt: fs.statSync(agentsMd).mtime.toISOString(),
    tags: hubUiTags(["catalog", "p0004"]),
  });
}

function scanHubUiPackage(items) {
  const readme = path.join(devRoot, "packages", "hub-ui", "README.md");
  if (!fs.existsSync(readme)) return;
  const raw = fs.readFileSync(readme, "utf8");
  addItem(items, {
    id: "packages-hub-ui-readme",
    kind: "contract",
    name: "hub-ui README",
    path: relWorkspace(readme),
    scope: "package",
    agentRequestable: true,
    summary: "@tool-workspace/hub-ui — install, CSS, exports, tab pattern",
    bodyPreview: raw.slice(0, 1200),
    lines: raw.split(/\r?\n/).length,
    updatedAt: fs.statSync(readme).mtime.toISOString(),
    tags: hubUiTags(["package"]),
  });
}

function scanHubContracts(items) {
  const targets = [
    path.join(toolRoot, "packages", "hub-load", "src", "index.ts"),
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
      tags: hubUiTags(["hub-load"]),
    });
  }
}

function main() {
  const items = [];
  scanRules(items);
  scanSkills(items, path.join(cursorRoot, ".cursor", "skills"), "workspace");
  scanCommands(items);
  scanHubScripts(items);
  scanHubKeyboardDoc(items);
  scanAgentsCatalog(items);
  scanHubUiPackage(items);
  scanHubContracts(items);

  const manifest = {
    generatedAt: new Date().toISOString(),
    workspaceRoot: devRoot,
    items: items.sort((a, b) => a.kind.localeCompare(b.kind) || a.name.localeCompare(b.name)),
  };

  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, JSON.stringify(manifest, null, 2), "utf8");
  const hubCount = items.filter((i) => i.tags?.includes("hub-ui")).length;
  console.log(`OK  agent-manifest.json (${items.length} items, ${hubCount} hub-ui tagged)`);
}

main();
