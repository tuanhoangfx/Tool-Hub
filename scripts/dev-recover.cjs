#!/usr/bin/env node
/**
 * Recover Tool Hub dev server after esbuild/Vite crash (ERR_CONNECTION_REFUSED overlay).
 * Kills :5176, clears Vite cache, starts detached daemon.
 *
 * Usage: node scripts/dev-recover.cjs [--open]
 */
const { execSync, spawn } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const open = process.argv.includes("--open");
const viteCache = path.join(root, "node_modules", ".vite");

function log(msg) {
  console.log(`[P0004 recover] ${msg}`);
}

log("Freeing port 5176…");
execSync(`node "${path.join(__dirname, "kill-port.cjs")}" 5176`, { cwd: root, stdio: "inherit" });

const pidFile = path.join(root, ".dev-vite.pid");
try {
  fs.unlinkSync(pidFile);
} catch {
  /* ignore */
}

if (fs.existsSync(viteCache)) {
  log("Clearing Vite cache (node_modules/.vite)…");
  fs.rmSync(viteCache, { recursive: true, force: true });
}

const args = ["scripts/ensure-dev.cjs"];
if (open) args.push("--open");

const child = spawn(process.execPath, args, {
  cwd: root,
  stdio: "inherit",
  env: process.env,
});
child.on("exit", (code) => process.exit(code ?? 0));
