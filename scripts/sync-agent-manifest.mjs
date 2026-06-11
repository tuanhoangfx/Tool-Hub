/**
 * Scan workspace Cursor rules/skills/commands + Hub UI stack → public/agent-manifest.json
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  loadShipKeywords,
  gateCmdForKeyword,
  formatCheatSheetTable,
  generateAgentKeywordGuide,
  allKeywordRows,
  pickScreensForPattern,
  enrichScreensFromCatalog,
  buildKeywordContentFields,
  buildGuideSections,
} from "../../scripts/lib/ship-keywords-lib.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const hubRoot = path.resolve(__dirname, "..");
const devRoot = path.resolve(hubRoot, "../..");
const toolRoot = path.join(devRoot, "Tool");
const cursorRoot = devRoot;
const outFile = path.join(hubRoot, "public", "agent-manifest.json");

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

const INFRA_SKILL_NAMES = new Set(["ship-until-done", "p00xx-ship-keywords", "p00xx-supabase-ops"]);

const ONBOARDING_SKILL_NAMES = new Set([
  "ship-until-done",
  "p00xx-ship-keywords",
  "p00xx-clone-hub-shell",
  "p00xx-tool-onboard",
  "p00xx-supabase-ops",
]);

function infraTags(extra = []) {
  return ["infrastructure", ...extra];
}

/** Reading mode fields for SKILL.md rows (onboarding skills). */
function buildSkillContentFields(body, fm, folder) {
  const fields = [{ label: "Skill", value: folder, variant: "code" }];
  if (fm.description) fields.push({ label: "When to use", value: fm.description, variant: "text" });
  if (fm.name && fm.name !== folder) fields.push({ label: "Package name", value: fm.name, variant: "code" });

  const sectionTitles = [...body.matchAll(/^##\s+(.+)$/gm)].map((m) => m[1].trim()).slice(0, 8);
  if (sectionTitles.length) {
    fields.push({ label: "Sections", value: sectionTitles.join(" · "), variant: "text" });
  }

  const ps = body.match(/```powershell\r?\n([\s\S]*?)```/);
  if (ps) {
    const lines = ps[1].trim().split(/\r?\n/).filter(Boolean);
    fields.push({
      label: "Script entry",
      value: lines[0],
      variant: "code",
      copy: true,
    });
    if (lines.length > 1) {
      fields.push({ label: "Script variants", value: lines.slice(1, 4).join("\n"), variant: "multiline" });
    }
  }

  const bash = body.match(/```bash\r?\n([\s\S]*?)```/);
  if (bash && !ps) {
    fields.push({ label: "Command", value: bash[1].trim().split(/\r?\n/)[0], variant: "code", copy: true });
  }

  return fields;
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
      tags: isHubUi ? hubUiTags(["rule", "cursor"]) : ["rule", "cursor", "workspace"],
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
    const isInfra = INFRA_SKILL_NAMES.has(folder);
    const isOnboarding = ONBOARDING_SKILL_NAMES.has(folder);
    addItem(items, {
      id: slugId(rel),
      kind: "skill",
      name: folder,
      path: rel,
      scope,
      trigger: fm.description || "",
      summary: String(fm.description || body.slice(0, 200)).slice(0, 240),
      bodyPreview: body.slice(0, 1200),
      contentFields: buildSkillContentFields(body, fm, folder),
      lines: body.split(/\r?\n/).length,
      updatedAt: fs.statSync(file).mtime.toISOString(),
      tags: isOnboarding
        ? infraTags(["skill", "cursor", "onboarding", isInfra ? "ship" : "hub-ui"])
        : isInfra
          ? infraTags(["skill", "cursor", "ship"])
          : isHubUi
            ? hubUiTags(["skill", "cursor"])
            : ["skill", "cursor", scope],
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
    const hub =
      name.includes("hub") ||
      raw.toLowerCase().includes("hub-ui") ||
      raw.toLowerCase().includes("p0004");
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
      tags: hub ? hubUiTags(["command", "cursor"]) : ["command", "cursor", "workspace"],
    });
  }
}

function parseAgentFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};
  const fm = {};
  for (const line of match[1].split(/\r?\n/)) {
    const m = line.match(/^([\w-]+):\s*(.+)$/);
    if (m) fm[m[1]] = m[2].trim();
  }
  return fm;
}

function scanCursorAgents(items) {
  const agentsDir = path.join(cursorRoot, ".cursor", "agents");
  if (!fs.existsSync(agentsDir)) return;
  for (const ent of fs.readdirSync(agentsDir, { withFileTypes: true })) {
    if (!ent.isFile() || !ent.name.endsWith(".md")) continue;
    const file = path.join(agentsDir, ent.name);
    const raw = fs.readFileSync(file, "utf8");
    const fm = parseAgentFrontmatter(raw);
    const rel = relWorkspace(file);
    const name = fm.name || path.basename(ent.name, ".md");
    const body = raw.replace(/^---[\s\S]*?---\r?\n?/, "").trim();
    addItem(items, {
      id: slugId(rel),
      kind: "agent",
      name,
      path: rel,
      scope: "workspace",
      agentRequestable: true,
      trigger: fm.description || "",
      summary: String(fm.description || body.slice(0, 200)).slice(0, 240),
      bodyPreview: body.slice(0, 1200),
      lines: body.split(/\r?\n/).length,
      updatedAt: fs.statSync(file).mtime.toISOString(),
      tags: ["agent", "cursor", "workspace"],
    });
  }
}

function scanPlaybooks(items) {
  const dir = path.join(toolRoot, "docs", "playbooks");
  if (!fs.existsSync(dir)) return;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!ent.isFile() || !ent.name.endsWith(".md")) continue;
    const file = path.join(dir, ent.name);
    const raw = fs.readFileSync(file, "utf8");
    const rel = relWorkspace(file);
    const title = raw.split("\n").find((l) => l.startsWith("#"))?.replace(/^#+\s*/, "") || ent.name;
    addItem(items, {
      id: slugId(rel),
      kind: "doc",
      name: title.slice(0, 80),
      path: rel,
      scope: "workspace",
      agentRequestable: true,
      summary: title.slice(0, 240),
      bodyPreview: raw.slice(0, 1200),
      lines: raw.split(/\r?\n/).length,
      updatedAt: fs.statSync(file).mtime.toISOString(),
      tags: ["playbook", "workspace"],
    });
  }
}

function scanShipScript(items) {
  const file = path.join(toolRoot, "scripts", "ship-product.ps1");
  if (!fs.existsSync(file)) return;
  const raw = fs.readFileSync(file, "utf8");
  addItem(items, {
    id: "tool-scripts-ship-product",
    kind: "command",
    name: "ship-product.ps1",
    path: relWorkspace(file),
    scope: "workspace",
    agentRequestable: true,
    summary: "Git / Push / Release pipeline (PowerShell)",
    bodyPreview: raw.slice(0, 1200),
    lines: raw.split(/\r?\n/).length,
    updatedAt: fs.statSync(file).mtime.toISOString(),
    tags: infraTags(["ship", "workspace", "script"]),
  });
}

function scanInfraScripts(items) {
  const scripts = [
    {
      file: "agent-verify-gate.mjs",
      summary: "Ship verify gate — machine-readable acceptance checklist (ship-until-done)",
    },
    {
      file: "hub-ui-browser-smoke.mjs",
      summary: "Browser MCP smoke contract per product (ship-until-done ladder)",
    },
  ];
  for (const row of scripts) {
    const file = path.join(toolRoot, "scripts", row.file);
    if (!fs.existsSync(file)) continue;
    const raw = fs.readFileSync(file, "utf8");
    addItem(items, {
      id: slugId(relWorkspace(file)),
      kind: "command",
      name: row.file,
      path: relWorkspace(file),
      scope: "workspace",
      agentRequestable: true,
      summary: row.summary,
      bodyPreview: raw.slice(0, 1200),
      lines: raw.split(/\r?\n/).length,
      updatedAt: fs.statSync(file).mtime.toISOString(),
      tags: infraTags(["script", "ship", "gate"]),
    });
  }

  const ssotPath = path.join(toolRoot, "scripts", "lib", "ship-keywords.json");
  if (fs.existsSync(ssotPath)) {
    const raw = fs.readFileSync(ssotPath, "utf8");
    addItem(items, {
      id: "ship-keywords-ssot",
      kind: "doc",
      name: "ship-keywords.json (SSOT)",
      path: relWorkspace(ssotPath),
      scope: "workspace",
      agentRequestable: true,
      summary: "Single source for Ship/Loop/Deploy keywords - rule table + Agent manifest",
      bodyPreview: raw.slice(0, 1200),
      lines: raw.split(/\r?\n/).length,
      updatedAt: fs.statSync(ssotPath).mtime.toISOString(),
      tags: infraTags(["keyword", "ship", "ssot"]),
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

function buildPatternContentFields(row) {
  const g = row.golden ?? {};
  const fields = [
    { label: "Pattern ID", value: row.id, variant: "code" },
    { label: "Layer", value: row.layer ?? "screen", variant: "text" },
    { label: "Golden", value: g.ref ?? "—", variant: "code" },
    { label: "Golden screen", value: g.screenPath ?? "—", variant: "code" },
  ];
  if (g.tablePath) fields.push({ label: "Golden table", value: g.tablePath, variant: "code" });
  if (row.screenTemplate) fields.push({ label: "Screen template", value: row.screenTemplate, variant: "code" });
  if (row.parentPattern) fields.push({ label: "Parent pattern", value: row.parentPattern, variant: "code" });
  if (row.summary) fields.push({ label: "Summary", value: String(row.summary), variant: "text" });
  if (row.verify) fields.push({ label: "Verify", value: String(row.verify), variant: "text" });
  if ((row.panels ?? []).length) {
    fields.push({
      label: "Panels",
      value: row.panels.map((p) => `${p.id}${p.skin ? ` (${p.skin})` : ""}`).join(", "),
      variant: "text",
    });
  }
  const clones = row.clones ?? [];
  if (clones.length) {
    fields.push({
      label: "Clones",
      value: clones
        .map((c) => `${c.product}/${c.screen}${c.status ? ` [${c.status}]` : ""}${c.notes ? ` — ${c.notes}` : ""}`)
        .join("\n"),
      variant: "multiline",
    });
  }
  return fields;
}

function buildInfraShipStackContentFields(links) {
  return [
    {
      label: "Flow",
      value:
        "Prompt keyword (SSOT) → skill → agent-verify-gate.mjs → static parity + dev stack → browser MCP smoke → stop hooks",
      variant: "text",
    },
    { label: "Keywords SSOT", value: "Tool/scripts/lib/ship-keywords.json", variant: "code" },
    { label: "Human guide", value: "Tool/docs/playbooks/agent-keyword-guide.md", variant: "code" },
    { label: "Verify loop skill", value: "ship-until-done", variant: "code" },
    { label: "Hub clone skill", value: "p00xx-clone-hub-shell", variant: "code" },
    { label: "Git/Deploy skill", value: "p00xx-ship-keywords", variant: "code" },
    { label: "Supabase skill", value: "p00xx-supabase-ops", variant: "code" },
    {
      label: "Gate command",
      value: "node Tool/scripts/agent-verify-gate.mjs --code P00xx --json --mark-active --ensure-dev",
      variant: "code",
      copy: true,
    },
    {
      label: "Browser smoke",
      value: "node Tool/scripts/hub-ui-browser-smoke.mjs",
      variant: "code",
      copy: true,
    },
    {
      label: "Linked paths",
      value: links.map((l) => `${l.label}: ${l.path}`).join("\n"),
      variant: "multiline",
    },
    {
      label: "Priority",
      value: "Dùng keyword prompt (Agent keyword guide) — không gắn skill thủ công.",
      variant: "text",
    },
  ];
}

function formatCatalogSkillBody(row) {
  const golden = row.golden ?? {};
  const goldenLines = Object.entries(golden).map(([k, v]) => `- **${k}:** \`${v}\``);
  return [
    `# ${row.name}`,
    "",
    `ID: \`${row.id}\``,
    `Status: ${row.status ?? "ready"}`,
    row.skillPath ? `Skill: \`${row.skillPath}\`` : "",
    row.doc ? `Doc: ${row.doc}` : "",
    "",
    row.summary ?? "",
    "",
    (row.triggers ?? []).length ? `## Triggers\n${row.triggers.map((t) => `- ${t}`).join("\n")}` : "",
    (row.antiTriggers ?? []).length
      ? `\n## Anti-triggers\n${row.antiTriggers.map((t) => `- ${t}`).join("\n")}`
      : "",
    (row.workflow ?? []).length ? `\n## Workflow\n${row.workflow.map((s, i) => `${i + 1}. ${s}`).join("\n")}` : "",
    goldenLines.length ? `\n## Golden refs\n${goldenLines.join("\n")}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function buildCatalogSkillContentFields(row) {
  const golden = row.golden ?? {};
  const fields = [
    { label: "Catalog ID", value: row.id, variant: "code" },
    { label: "Status", value: row.status ?? "ready", variant: "text" },
    { label: "Skill path", value: row.skillPath ?? "—", variant: "code", copy: Boolean(row.skillPath) },
    { label: "Doc", value: row.doc ?? "—", variant: "code" },
    { label: "Summary", value: String(row.summary ?? ""), variant: "text" },
  ];
  if ((row.triggers ?? []).length) {
    fields.push({ label: "Triggers", value: row.triggers.join("\n"), variant: "multiline" });
  }
  if ((row.antiTriggers ?? []).length) {
    fields.push({ label: "Anti-triggers", value: row.antiTriggers.join("\n"), variant: "multiline" });
  }
  if ((row.workflow ?? []).length) {
    fields.push({ label: "Workflow", value: row.workflow.map((s, i) => `${i + 1}. ${s}`).join("\n"), variant: "multiline" });
  }
  if (Object.keys(golden).length) {
    fields.push({
      label: "Golden refs",
      value: Object.entries(golden)
        .map(([k, v]) => `${k}: ${v}`)
        .join("\n"),
      variant: "multiline",
    });
  }
  return fields;
}

function scanCatalogSkills(items) {
  const catalogPath = path.join(toolRoot, "schemas", "ui-patterns.catalog.json");
  if (!fs.existsSync(catalogPath)) return;

  const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
  const catalogMtime = fs.statSync(catalogPath).mtime.toISOString();
  const skills = Array.isArray(catalog.skills) ? catalog.skills : [];

  for (const row of skills) {
    if (!row?.id || !row?.name) continue;
    const skillRel = row.skillPath ? String(row.skillPath).replace(/\//g, path.sep) : null;
    const skillAbs = skillRel ? path.join(cursorRoot, skillRel) : null;
    const body = formatCatalogSkillBody(row);
    addItem(items, {
      id: `catalog-skill-${row.id}`,
      kind: "skill",
      name: row.name,
      path: skillAbs && fs.existsSync(skillAbs) ? relWorkspace(skillAbs) : relWorkspace(catalogPath),
      scope: "workspace",
      agentRequestable: true,
      trigger: (row.triggers ?? []).slice(0, 2).join(" · ") || row.id,
      summary: String(row.summary || row.id).slice(0, 240),
      bodyPreview: body.slice(0, 1200),
      contentFields: buildCatalogSkillContentFields(row),
      lines: body.split(/\r?\n/).length,
      updatedAt: skillAbs && fs.existsSync(skillAbs) ? fs.statSync(skillAbs).mtime.toISOString() : catalogMtime,
      tags: ["skill", "catalog-skill", "cursor", row.status ?? "ready"],
    });
  }
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
      contentFields: buildPatternContentFields(row),
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
      contentFields: buildPatternContentFields(row),
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

function scanCursorHooksProfile(items) {
  const cursorDir = path.join(cursorRoot, ".cursor");
  const activePath = path.join(cursorDir, "hooks.json");

  let active = null;
  if (fs.existsSync(activePath)) {
    try {
      const j = JSON.parse(fs.readFileSync(activePath, "utf8"));
      const hooks = j.hooks || {};
      const eventNames = Object.keys(hooks);
      const commandCount = eventNames.reduce((n, key) => n + (hooks[key]?.length ?? 0), 0);
      active = {
        notes: j.notes || "",
        events: eventNames.length,
        commandCount,
        hasSessionStart: eventNames.includes("sessionStart") && (hooks.sessionStart?.length ?? 0) > 0,
        hasAfterFileEdit: eventNames.includes("afterFileEdit"),
        eventNames,
      };
    } catch {
      active = null;
    }
  }

  const bodyPreview = `# Cursor hooks profile

**Active file:** \`.cursor/hooks.json\` (source of truth)
**Notes:** ${active?.notes ?? "—"}

| Events | Commands | sessionStart | afterFileEdit |
|--------|----------|--------------|---------------|
| ${active?.events ?? "—"} | ${active?.commandCount ?? "—"} | ${active?.hasSessionStart ? "yes" : "no"} | ${active?.hasAfterFileEdit ? "yes (heavy)" : "no"} |

**Events:** ${active?.eventNames?.join(", ") ?? "—"}

## Doc sync (manual — no afterFileEdit hook)

After editing \`.cursor/rules\`, \`commands/\`, \`skills/\`, \`agents/\`, or playbooks:

\`\`\`powershell
cd E:\\Dev\\Tool\\P0004-Tool-Hub
pnpm agent:manifest
\`\`\`

Optional tool-docs sync: \`powershell -File E:\\Dev\\.cursor\\hooks\\sync-tool-docs.ps1\`

Reload Cursor after editing \`hooks.json\`.`;

  addItem(items, {
    id: "cursor-hooks-profile",
    kind: "doc",
    name: "Cursor hooks profile",
    path: relWorkspace(activePath),
    scope: "workspace",
    agentRequestable: true,
    summary: `Active hooks · ${active?.commandCount ?? "?"} cmds · no afterFileEdit · manifest via pnpm agent:manifest`,
    bodyPreview,
    lines: bodyPreview.split("\n").length,
    updatedAt: fs.existsSync(activePath) ? fs.statSync(activePath).mtime.toISOString() : new Date().toISOString(),
    tags: infraTags(["cursor", "hooks", "workspace"]),
  });
}

function scanCursorStopHooks(items) {
  const cursorDir = path.join(cursorRoot, ".cursor");
  const hooksPath = path.join(cursorDir, "hooks.json");
  const hookScripts = {
    "verify-working-rules-on-stop.ps1": {
      role: "Format gate",
      checks: "Version line + 3 numbered proposals (dev-workspace §1)",
      loopLimit: 2,
      dynamicLimit: false,
    },
    "verify-ship-gate-on-stop.ps1": {
      role: "Ship verify gate",
      checks: "Verified at + Result block; runs agent-verify-gate.mjs --json gate diff",
      loopLimit: 2,
      dynamicLimit: true,
      loopModeLimit: 12,
    },
    "verify-version-bump-on-stop.ps1": {
      role: "Version / CHANGELOG",
      checks: "Product code changed without version files or CHANGELOG block",
      loopLimit: 2,
      dynamicLimit: false,
    },
  };

  let stopHooks = [];
  if (fs.existsSync(hooksPath)) {
    try {
      const hooks = JSON.parse(fs.readFileSync(hooksPath, "utf8"));
      stopHooks = hooks.hooks?.stop ?? [];
    } catch {
      stopHooks = [];
    }
  }

  const rows = stopHooks.map((h, i) => {
    const script = path.basename(String(h.command ?? "").replace(/.*\\/, ""));
    const meta = hookScripts[script] ?? { role: "—", checks: "—", loopLimit: h.loop_limit ?? "—" };
    const limit =
      meta.dynamicLimit && meta.loopModeLimit
        ? `${meta.loopLimit} (loop intent: ${meta.loopModeLimit})`
        : String(meta.loopLimit ?? h.loop_limit ?? "—");
    return `| ${i + 1} | \`${script}\` | ${meta.role} | ${limit} | ${meta.checks} |`;
  });

  const bodyPreview = `# Cursor stop hooks (ship enforcement)

**Event:** \`stop\` — runs when agent tries to end turn (profile: active \`.cursor/hooks.json\`)

| # | Script | Role | loop_limit | Checks |
|---|--------|------|------------|--------|
${rows.join("\n")}

## Ship gate diff (verify-ship-gate-on-stop)

When \`working-rules-audit.json\` reports missing ship verify block:

1. Reads \`ship-gate-active.json\` for code + intent (loop → 12 nudges)
2. Runs \`agent-verify-gate.mjs --json --ensure-dev\`
3. Injects **Gate diff** — pending acceptance items into \`followup_message\`

## Related

- \`audit-agent-response.ps1\` (afterAgentResponse) — writes audit state
- SSOT keywords: \`Tool/scripts/lib/ship-keywords.json\`
- Sync rule table: \`node Tool/scripts/sync-ship-keywords.mjs\``;

  addItem(items, {
    id: "cursor-stop-hooks",
    kind: "doc",
    name: "Cursor stop hooks (ship enforcement)",
    path: relWorkspace(hooksPath),
    scope: "workspace",
    agentRequestable: true,
    summary: `3 stop hooks · ship gate diff · loop_limit 2 (loop intent: 12)`,
    bodyPreview,
    lines: bodyPreview.split("\n").length,
    updatedAt: fs.existsSync(hooksPath) ? fs.statSync(hooksPath).mtime.toISOString() : new Date().toISOString(),
    tags: infraTags(["cursor", "hooks", "ship", "workspace"]),
  });
}

function scanInfraShipStackBundle(items) {
  const guidePath = path.join(toolRoot, "docs", "playbooks", "agent-keyword-guide.md");
  const ssotPath = path.join(toolRoot, "scripts", "lib", "ship-keywords.json");
  const hubUiReadme = path.join(devRoot, "packages", "hub-ui", "README.md");

  const links = [
    { label: "Keywords SSOT", path: relWorkspace(ssotPath) },
    { label: "Agent keyword guide (human)", path: relWorkspace(guidePath) },
    { label: "ship-until-done skill", path: relWorkspace(path.join(cursorRoot, ".cursor", "skills", "ship-until-done", "SKILL.md")) },
    { label: "p00xx-clone-hub-shell skill", path: relWorkspace(path.join(cursorRoot, ".cursor", "skills", "p00xx-clone-hub-shell", "SKILL.md")) },
    { label: "p00xx-ship-keywords skill", path: relWorkspace(path.join(cursorRoot, ".cursor", "skills", "p00xx-ship-keywords", "SKILL.md")) },
    { label: "p00xx-supabase-ops skill", path: relWorkspace(path.join(cursorRoot, ".cursor", "skills", "p00xx-supabase-ops", "SKILL.md")) },
    { label: "p00xx-tool-onboard skill", path: relWorkspace(path.join(cursorRoot, ".cursor", "skills", "p00xx-tool-onboard", "SKILL.md")) },
    { label: "agent-verify-gate.mjs", path: relWorkspace(path.join(toolRoot, "scripts", "agent-verify-gate.mjs")) },
    { label: "hub-ui-browser-smoke.mjs", path: relWorkspace(path.join(toolRoot, "scripts", "hub-ui-browser-smoke.mjs")) },
    { label: "cursor-stop-hooks doc", path: "manifest:cursor-stop-hooks" },
    { label: "cursor-hooks-profile doc", path: "manifest:cursor-hooks-profile" },
    { label: "hub-ui package", path: fs.existsSync(hubUiReadme) ? relWorkspace(hubUiReadme) : "packages/hub-ui/README.md" },
    { label: "ui-patterns.catalog.json", path: relWorkspace(path.join(toolRoot, "schemas", "ui-patterns.catalog.json")) },
  ];

  const bodyPreview = `# Infra ship stack (onboarding bundle)

**Start here** for Ship/Loop/Fix/Smoke/Hub UI clone / **Migrate** tasks.

## Flow

\`\`\`
Prompt keyword (SSOT)
  → skill (ship-until-done | clone-hub-shell | ship-keywords)
  → agent-verify-gate.mjs --json --mark-active
  → static parity + dev stack + browser MCP smoke
  → stop hooks enforce Verified at + Result
\`\`\`

## Stack map

| Layer | Artifact |
|-------|----------|
| Keywords | \`Tool/scripts/lib/ship-keywords.json\` |
| Human guide | \`Tool/docs/playbooks/agent-keyword-guide.md\` |
| Verify loop | \`.cursor/skills/ship-until-done/SKILL.md\` |
| Hub clone | \`.cursor/skills/p00xx-clone-hub-shell/SKILL.md\` |
| Git/Deploy | \`.cursor/skills/p00xx-ship-keywords/SKILL.md\` + \`ship-product.ps1\` |
| Supabase | \`.cursor/skills/p00xx-supabase-ops/SKILL.md\` · keyword \`Migrate P00xx\` |
| Gate JSON | \`Tool/scripts/agent-verify-gate.mjs\` |
| Browser contract | \`Tool/scripts/hub-ui-browser-smoke.mjs\` |
| Enforcement | \`cursor-stop-hooks\` + \`cursor-hooks-profile\` (Agent tab) |
| UI patterns | \`Tool/schemas/ui-patterns.catalog.json\` + Kind=Pattern |
| Shared UI | \`packages/hub-ui\` (\`@tool-workspace/hub-ui\`) |

## Linked paths

${links.map((l) => `- **${l.label}:** \`${l.path}\``).join("\n")}

## Priority

Use **keyword prompts** (see **Agent keyword guide**) — not manual skill attach.`;

  addItem(items, {
    id: "infra-ship-stack",
    kind: "doc",
    name: "Infra ship stack (start here)",
    path: relWorkspace(ssotPath),
    scope: "workspace",
    agentRequestable: true,
    summary: "Onboarding bundle: SSOT keywords → skills → gate → smoke → hooks → hub-ui",
    bodyPreview,
    contentFields: buildInfraShipStackContentFields(links),
    lines: bodyPreview.split("\n").length,
    updatedAt: fs.existsSync(ssotPath) ? fs.statSync(ssotPath).mtime.toISOString() : new Date().toISOString(),
    tags: infraTags(["ship", "onboarding", "workspace"]),
  });
}

function loadKeywordCatalog() {
  const catalogPath = path.join(toolRoot, "schemas", "ui-patterns.catalog.json");
  return enrichScreensFromCatalog(loadShipKeywords(), catalogPath);
}

function addAgentKeywordGuide(items) {
  const catalog = loadKeywordCatalog();
  const guidePath = path.join(toolRoot, "docs", "playbooks", "agent-keyword-guide.md");
  const guideMd = generateAgentKeywordGuide(catalog);
  fs.mkdirSync(path.dirname(guidePath), { recursive: true });
  fs.writeFileSync(guidePath, guideMd, "utf8");

  const totalKw = (catalog.keywords?.length ?? 0) + (catalog.patternKeywords?.length ?? 0);
  const guideSections = buildGuideSections(catalog);
  addItem(items, {
    id: "agent-keyword-guide",
    kind: "doc",
    name: "Agent keyword guide (ưu tiên prompt)",
    path: relWorkspace(guidePath),
    scope: "workspace",
    agentRequestable: true,
    summary: `${totalKw} keywords · verify · git · pattern · migrate · screensByProduct · tiếng Việt`,
    bodyPreview: guideMd.slice(0, 6000),
    lines: guideMd.split("\n").length,
    updatedAt: fs.statSync(guidePath).mtime.toISOString(),
    tags: infraTags(["keyword", "ship", "guide", "onboarding"]),
    guideSections,
  });
}

function addShipKeywordCheatSheet(items) {
  const now = new Date().toISOString();
  const rulePath = relWorkspace(path.join(cursorRoot, ".cursor", "rules", "dev-workspace-compact.mdc"));
  const catalog = loadKeywordCatalog();
  const rows = allKeywordRows(catalog);
  const table = formatCheatSheetTable(catalog);
  const gateBase = catalog.gate.base;

  addItem(items, {
    id: "keyword-ship-cheatsheet",
    kind: "doc",
    name: "Ship keywords cheat sheet (quick table)",
    path: rulePath,
    scope: "workspace",
    agentRequestable: true,
    summary: "Bảng nhanh — chi tiết xem Agent keyword guide",
    bodyPreview: `# Ship keywords (quick)\n\n**Chi tiết:** mở doc **Agent keyword guide** cùng tab Agent.\n\n| Keyword | Skill | Example |\n|---------|-------|--------|\n${table}\n\nGate:\n\`${gateBase}\``,
    lines: rows.length + 8,
    updatedAt: now,
    tags: infraTags(["cursor", "keyword", "ship", "onboarding"]),
  });

  for (const row of rows) {
    const gateCmd = gateCmdForKeyword(row, catalog);
    const isPattern = Boolean(row.patternId);
    const isMigrate = row.group === "supabase";
    const tags = infraTags([
      "cursor",
      "keyword",
      isPattern ? "pattern" : "ship",
      isMigrate ? "supabase" : row.tier,
    ]);
    let screenBlock = "";
    if (isPattern && row.patternId) {
      const hints = ["P0004", "P0016", "P0020", "P0008", "P0021"]
        .map((code) => {
          const tabs = pickScreensForPattern(catalog, row.patternId, code);
          return tabs.length ? `${code}: ${tabs.join(", ")}` : null;
        })
        .filter(Boolean)
        .join("\n");
      if (hints) screenBlock = `\n\n**screensByProduct (gợi ý tab):**\n${hints}`;
    }
    addItem(items, {
      id: row.id,
      kind: "command",
      name: row.name,
      path: rulePath,
      scope: "workspace",
      commandId: row.id.replace(/^keyword-/, ""),
      agentRequestable: true,
      trigger: row.skill,
      summary: row.summary,
      bodyPreview: `# ${row.name}\n\n${row.guideVi ? row.guideVi + "\n\n" : ""}**Example:** \`${row.example}\`\n\n**Skill:** ${row.skill}\n\n**Tier:** ${row.tier}${row.patternId ? `\n\n**Pattern:** \`${row.patternId}\` · golden \`${row.goldenRef ?? "—"}\`` : ""}\n\n**Command:**\n\`\`\`bash\n${gateCmd}\n\`\`\`${screenBlock}${row.commonScreens ? `\n\n**Tabs (legacy):** ${row.commonScreens}` : ""}`,
      contentFields: buildKeywordContentFields(row, catalog),
      keywordGroup: row.group ?? undefined,
      lines: 20,
      updatedAt: now,
      tags,
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
  scanCursorAgents(items);
  scanPlaybooks(items);
  scanShipScript(items);
  scanInfraScripts(items);
  scanHubScripts(items);
  scanHubKeyboardDoc(items);
  scanAgentsCatalog(items);
  scanHubUiPackage(items);
  scanHubPatterns(items);
  scanCatalogSkills(items);
  scanCursorHooksProfile(items);
  scanCursorStopHooks(items);
  scanInfraShipStackBundle(items);
  addAgentKeywordGuide(items);
  addShipKeywordCheatSheet(items);
  scanHubContracts(items);

  const manifest = {
    generatedAt: new Date().toISOString(),
    workspaceRoot: devRoot,
    items: items.sort((a, b) => a.kind.localeCompare(b.kind) || a.name.localeCompare(b.name)),
  };

  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, JSON.stringify(manifest, null, 2), "utf8");
  const hubCount = items.filter((i) => i.tags?.includes("hub-ui")).length;
  const cursorCount = items.filter((i) => i.tags?.includes("cursor")).length;
  console.log(`OK  agent-manifest.json (${items.length} items, ${hubCount} hub-ui, ${cursorCount} cursor)`);
}

main();
