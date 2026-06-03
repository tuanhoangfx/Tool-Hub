"use strict";

const fs = require("node:fs");
const path = require("node:path");

/** Parse KEY=VALUE lines (supports # comments and quoted values). */
function parseEnvFile(content) {
  const out = {};
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

function readEnvFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) return {};
    return parseEnvFile(fs.readFileSync(filePath, "utf8"));
  } catch {
    return {};
  }
}

/** Workspace dev root: E:\\Dev when cwd is under Tool/P00xx-* */
function workspaceDevRoot(fromCwd = process.cwd()) {
  let dir = fromCwd;
  for (let i = 0; i < 6; i++) {
    if (path.basename(dir).toLowerCase() === "tool") {
      return path.dirname(dir);
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return path.resolve(fromCwd, "../..");
}

function readSharedEnv(fromCwd = process.cwd()) {
  const devRoot = workspaceDevRoot(fromCwd);
  const candidates = [
    path.join(devRoot, ".env.shared"),
    path.join(fromCwd, ".env.shared"),
  ];
  for (const file of candidates) {
    const parsed = readEnvFile(file);
    if (Object.keys(parsed).length > 0) return parsed;
  }
  return {};
}

module.exports = {
  parseEnvFile,
  readEnvFile,
  workspaceDevRoot,
  readSharedEnv,
};
