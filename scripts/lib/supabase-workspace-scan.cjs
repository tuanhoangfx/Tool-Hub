const fs = require("node:fs");
const path = require("node:path");
const { scanAllRoots } = require("./workspace-scan.cjs");

const SUPABASE_URL_KEYS = [
  "VITE_SUPABASE_URL",
  "SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "VITE_HUB_SUPABASE_URL",
  "HUB_SUPABASE_URL",
  "VITE_DATABOX_SUPABASE_URL",
  "DATABOX_SUPABASE_URL",
  "OLD_SUPABASE_URL",
];

const ENV_FILE_NAMES = new Set([
  ".env",
  ".env.local",
  ".env.development",
  ".env.production",
  ".env.development.local",
  ".env.production.local",
  ".env.example",
]);

const SKIP_DIR_NAMES = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  ".next",
  "coverage",
  "schemas",
  "docs",
  "Backup",
  "Reference",
]);

const KEY_LABELS = {
  VITE_SUPABASE_URL: "Primary",
  SUPABASE_URL: "Primary",
  NEXT_PUBLIC_SUPABASE_URL: "Primary",
  VITE_HUB_SUPABASE_URL: "Hub identity",
  HUB_SUPABASE_URL: "Hub identity",
  VITE_DATABOX_SUPABASE_URL: "Data box",
  DATABOX_SUPABASE_URL: "Data box",
  OLD_SUPABASE_URL: "Legacy",
};

const PLACEHOLDER_RE =
  /your[-_]?project|placeholder|^xxx$|^ref$|^xxx\.supabase|^example/i;

function parseEnvContent(content) {
  const result = {};
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    result[key] = val;
  }
  return result;
}

function extractSupabaseRef(value) {
  if (!value || typeof value !== "string") return null;
  const trimmed = value.trim();
  const hostMatch = trimmed.match(/https?:\/\/([a-z0-9]{10,})\.supabase\.co/i);
  if (hostMatch) return hostMatch[1].toLowerCase();
  const dbMatch = trimmed.match(/db\.([a-z0-9]{10,})\.supabase\.co/i);
  if (dbMatch) return dbMatch[1].toLowerCase();
  return null;
}

function isPlaceholderRef(ref, url) {
  if (!ref) return true;
  if (PLACEHOLDER_RE.test(ref)) return true;
  if (url && PLACEHOLDER_RE.test(url)) return true;
  return false;
}

function findEnvFiles(dir, depth = 0, maxDepth = 3) {
  if (!dir || !fs.existsSync(dir) || depth > maxDepth) return [];
  const files = [];
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }

  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isFile() && ENV_FILE_NAMES.has(entry.name)) {
      files.push(full);
      continue;
    }
    if (!entry.isDirectory()) continue;
    if (SKIP_DIR_NAMES.has(entry.name)) continue;
    if (entry.name.startsWith(".") && entry.name !== ".vercel") continue;
    files.push(...findEnvFiles(full, depth + 1, maxDepth));
  }
  return files;
}

function scanTextForSupabaseUrls(text, sourceLabel) {
  const hits = [];
  if (!text) return hits;
  const re = /https?:\/\/([a-z0-9]{10,})\.supabase\.co/gi;
  let match;
  while ((match = re.exec(text)) !== null) {
    const ref = match[1].toLowerCase();
    if (isPlaceholderRef(ref, match[0])) continue;
    hits.push({ ref, url: match[0], envKey: sourceLabel, envFile: sourceLabel });
  }
  return hits;
}

function scanProjectForSupabase(project) {
  const bindings = [];
  const localPath = project.localPath;
  if (!localPath || !fs.existsSync(localPath)) return bindings;

  const envFiles = findEnvFiles(localPath);
  for (const envFile of envFiles) {
    const content = fs.readFileSync(envFile, "utf8");
    const parsed = parseEnvContent(content);
    for (const key of SUPABASE_URL_KEYS) {
      const url = parsed[key];
      if (!url) continue;
      const ref = extractSupabaseRef(url);
      if (!ref || isPlaceholderRef(ref, url)) continue;
      bindings.push({
        toolId: project.id,
        toolCode: project.code,
        toolName: project.name,
        localPath,
        workspaceRoot: project.workspaceRoot || "tool",
        envFile: path.relative(localPath, envFile).replace(/\\/g, "/"),
        envKey: key,
        envLabel: KEY_LABELS[key] || key,
        url: url.trim(),
        ref,
      });
    }
  }

  for (const rel of ["tool.manifest.json", "package.json", "README.md"]) {
    const filePath = path.join(localPath, rel);
    if (!fs.existsSync(filePath)) continue;
    try {
      const text = fs.readFileSync(filePath, "utf8");
      for (const hit of scanTextForSupabaseUrls(text, rel)) {
        bindings.push({
          toolId: project.id,
          toolCode: project.code,
          toolName: project.name,
          localPath,
          workspaceRoot: project.workspaceRoot || "tool",
          envFile: rel,
          envKey: hit.envKey,
          envLabel: "Manifest/docs",
          url: hit.url,
          ref: hit.ref,
        });
      }
    } catch {
      /* ignore */
    }
  }

  return bindings;
}

function dedupeBindings(bindings) {
  const seen = new Set();
  const out = [];
  for (const b of bindings) {
    const key = `${b.toolId}|${b.ref}|${b.envKey}|${b.envFile}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(b);
  }
  return out;
}

function groupByRef(allBindings) {
  const map = new Map();
  for (const binding of allBindings) {
    const row = map.get(binding.ref) || {
      ref: binding.ref,
      url: binding.url,
      labels: [],
      bindings: [],
    };
    if (!row.url) row.url = binding.url;
    if (binding.envLabel && !row.labels.includes(binding.envLabel)) {
      row.labels.push(binding.envLabel);
    }
    row.bindings.push(binding);
    map.set(binding.ref, row);
  }
  return [...map.values()].sort((a, b) => a.ref.localeCompare(b.ref));
}

function scanSupabaseWorkspace(configPath) {
  const { entries } = scanAllRoots(configPath);
  const projects = entries.filter((e) => e.assetKind === "project");
  const allBindings = dedupeBindings(projects.flatMap(scanProjectForSupabase));
  const grouped = groupByRef(allBindings);

  const toolsWithSupabase = new Set(allBindings.map((b) => b.toolId));
  const toolsScanned = projects.length;

  return {
    ok: true,
    generatedAt: new Date().toISOString(),
    summary: {
      projectCount: grouped.length,
      toolBindingCount: allBindings.length,
      toolsScanned,
      toolsWithSupabase: toolsWithSupabase.size,
    },
    projects: grouped,
  };
}

module.exports = {
  SUPABASE_URL_KEYS,
  extractSupabaseRef,
  scanSupabaseWorkspace,
  scanProjectForSupabase,
};
