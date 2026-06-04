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

const HUB_UI_COMMAND_FILES = new Set(["design-5.md"]);

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

function hubGoldenLabel(golden) {
  if (!golden || typeof golden !== "object") return "—";
  return golden.ref || golden.label || "—";
}

function hubCloneLabel(clones, { exception } = {}) {
  if (exception) return String(exception);
  if (!Array.isArray(clones) || clones.length === 0) return "—";
  const parts = clones.map((c) => `${c.product}/${c.screen}${c.status === "migrate" ? "†" : ""}`);
  if (parts.length <= 4) return parts.join(", ");
  return `${parts.length}× ${parts.slice(0, 3).join(", ")}…`;
}

function hubCloneTooltip(clones) {
  if (!Array.isArray(clones) || clones.length === 0) return undefined;
  return clones.map((c) => `${c.product}/${c.screen}${c.notes ? ` — ${c.notes}` : ""}`).join("\n");
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
      String(fm.description || "").toLowerCase().includes("hub ui") ||
      String(fm.description || "").toLowerCase().includes("p0004 hub");
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
      kind: "command",
      name: ent.name,
      path: rel,
      scope: "workspace",
      agentRequestable: true,
      summary: `Hub UI script: ${ent.name}`,
      bodyPreview: raw.slice(0, 1200),
      lines: raw.split(/\r?\n/).length,
      updatedAt: fs.statSync(file).mtime.toISOString(),
      tags: hubUiTags(["command", "script"]),
    });
  }
}

function scanHubKeyboardDoc(items) {
  const doc = path.join(hubRoot, "docs", "HUB-KEYBOARD-SHORTCUTS.md");
  if (!fs.existsSync(doc)) return;
  const raw = fs.readFileSync(doc, "utf8");
  addItem(items, {
    id: "hub-keyboard-shortcuts",
    kind: "doc",
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
    kind: "doc",
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

function scanHubUiPackage(_items) {
  /* hub-ui README omitted — UI_PATTERNS.md covers package entry */
}

function formatCatalogBodyPreview(entry, extra = {}) {
  const lines = [
    `# ${entry.name}`,
    "",
    `Golden: ${entry.golden}`,
    ...(entry.goldenScreenPath ? [`Golden screen: ${entry.goldenScreenPath}`] : []),
    ...(extra.category ? [`Category: ${extra.category}`] : []),
    ...(entry.product ? [`Product: ${entry.product}`] : []),
    ...(entry.screenTemplate ? [`Screen template: ${entry.screenTemplate}`] : []),
    ...(entry.skin ? [`Skin: ${entry.skin}`] : []),
    ...(entry.component ? [`Component: ${entry.component}`] : []),
    `Status: ${entry.status}`,
    "",
    entry.summary,
    "",
    entry.features?.length ? `Features: ${entry.features.join(", ")}` : "",
    entry.verify ? `Verify: ${entry.verify}` : "",
    entry.sourcePath ? `Source: ${entry.sourcePath}` : "",
  ].filter(Boolean);
  return lines.join("\n");
}

function formatUnifiedPatternBody(row) {
  const g = row.golden ?? {};
  const cloneLines = (row.clones ?? []).map((c) => {
    const st = c.status ? ` [${c.status}]` : "";
    return `- ${c.product}/${c.screen}${st}${c.notes ? ` — ${c.notes}` : ""}`;
  });
  const lines = [
    `# ${row.name}`,
    "",
    `Layer: ${row.layer ?? "screen"}`,
    `Pattern ID: ${row.id}`,
    row.screenTemplate ? `Screen template: ${row.screenTemplate}` : "",
    row.parentPattern ? `Parent pattern: ${row.parentPattern}` : "",
    row.tablePart ? `Table part: ${row.tablePart}` : "",
    (row.panels ?? []).length
      ? `Panels (in-screen): ${row.panels.map((p) => `${p.id}${p.skin ? ` (${p.skin})` : ""}`).join(", ")}`
      : "",
    `Status: ${row.status ?? "ready"}`,
    "",
    `Golden: ${g.ref ?? "—"}`,
    `Screen: ${g.screenPath ?? "—"}`,
    g.tablePath ? `Table: ${g.tablePath}` : "",
    "",
    row.summary ?? "",
    (row.composed ?? []).length ? `Composed: ${row.composed.join(", ")}` : "",
    row.verify ? `Verify: ${row.verify}` : "",
    "",
    cloneLines.length ? "## Clones\n" : "",
    ...cloneLines,
  ].filter(Boolean);
  return lines.join("\n");
}

function patternPathMeta(row, catalogPath, catalogMtime) {
  const g = row.golden ?? {};
  const relPath = g.screenPath ?? g.tablePath ?? row.screenPath;
  const abs = relPath ? path.join(devRoot, String(relPath).replace(/\//g, path.sep)) : null;
  return {
    displayPath: abs && fs.existsSync(abs) ? relWorkspace(abs) : relWorkspace(catalogPath),
    updatedAt: abs && fs.existsSync(abs) ? fs.statSync(abs).mtime.toISOString() : catalogMtime,
  };
}

function scanHubPatterns(items) {
  const catalogPath = path.join(toolRoot, "schemas", "ui-patterns.catalog.json");
  if (!fs.existsSync(catalogPath)) return;

  const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
  const catalogMtime = fs.statSync(catalogPath).mtime.toISOString();
  const patterns = Array.isArray(catalog.patterns) ? catalog.patterns : [];

  for (const row of patterns) {
    if (!row?.id || !row?.name) continue;
    const g = row.golden ?? {};
    const body = formatUnifiedPatternBody(row);
    const { displayPath, updatedAt } = patternPathMeta(row, catalogPath, catalogMtime);
    const clones = row.clones ?? [];

    addItem(items, {
      id: `pattern-${row.id}`,
      kind: "pattern",
      name: row.name,
      layer: row.layer ?? "screen",
      path: displayPath,
      scope: "workspace",
      agentRequestable: true,
      trigger: `${row.layer ?? "screen"} · ${g.ref ?? row.id}`,
      summary: String(row.summary || `${row.layer} · ${g.ref}`).slice(0, 240),
      golden: g.ref ?? "—",
      clone: hubCloneLabel(clones),
      cloneTooltip: hubCloneTooltip(clones),
      bodyPreview: body.slice(0, 1200),
      lines: body.split(/\r?\n/).length,
      updatedAt,
      tags: hubUiTags(["pattern", row.layer, row.id, row.status ?? "ready"]),
    });
  }

  const exceptions = Array.isArray(catalog.exceptions) ? catalog.exceptions : [];
  for (const row of exceptions) {
    if (!row?.id) continue;
    const body = formatUnifiedPatternBody({
      ...row,
      name: row.name,
      layer: "exception",
      golden: { ref: row.golden, screenPath: row.screenPath },
      clones: [],
    });
    const { displayPath, updatedAt } = patternPathMeta(row, catalogPath, catalogMtime);
    addItem(items, {
      id: `pattern-${row.id}`,
      kind: "pattern",
      name: `${row.name} (exception)`,
      layer: "exception",
      path: displayPath,
      scope: "workspace",
      agentRequestable: true,
      trigger: `exception · ${row.parentPattern ?? "directory"}`,
      summary: String(row.summary || row.golden).slice(0, 240),
      golden: row.golden ?? "—",
      clone: hubCloneLabel([], { exception: row.status ?? "exception" }),
      bodyPreview: body.slice(0, 1200),
      lines: body.split(/\r?\n/).length,
      updatedAt,
      tags: hubUiTags(["pattern", "exception", row.parentPattern ?? "directory"]),
    });
  }

  const uiPatternsMd = path.join(devRoot, "packages", "hub-ui", "UI_PATTERNS.md");
  if (fs.existsSync(uiPatternsMd)) {
    const raw = fs.readFileSync(uiPatternsMd, "utf8");
    const tools = catalog.toolsWithHubUi ?? {};
    const toolLines = Object.entries(tools).map(
      ([code, t]) => `- **${code}** (${t.role}): ${(t.screens ?? []).join(", ")}`,
    );
    addItem(items, {
      id: "packages-hub-ui-ui-patterns",
      kind: "doc",
      name: "UI_PATTERNS.md",
      path: relWorkspace(uiPatternsMd),
      scope: "package",
      agentRequestable: true,
      summary: `Hub UI unified patterns (${patterns.length}) — ui-patterns.catalog.json`,
      golden: "P0004",
      clone: Object.keys(tools)
        .filter((c) => tools[c].role !== "golden-source")
        .join(", "),
      bodyPreview: `${raw.slice(0, 900)}\n\n## Tools\n${toolLines.join("\n")}`.slice(0, 1200),
      lines: raw.split(/\r?\n/).length,
      updatedAt: fs.statSync(uiPatternsMd).mtime.toISOString(),
      tags: hubUiTags(["pattern", "catalog"]),
    });
  }
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
      kind: "doc",
      name,
      path: rel,
      scope: rel.includes("packages") ? "package" : "workspace",
      summary: `Hub reference: ${name}`,
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
  scanHubPatterns(items);
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
