"use strict";

const path = require("node:path");
const { spawn } = require("node:child_process");

function hubRootFromCwd(cwd) {
  return path.resolve(cwd);
}

function runAgentManifestSync(cwd = process.cwd()) {
  const root = hubRootFromCwd(cwd);
  const script = path.join(root, "scripts", "sync-agent-manifest.mjs");

  return new Promise((resolve) => {
    const child = spawn(process.execPath, [script], {
      cwd: root,
      windowsHide: true,
    });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill();
      resolve({
        ok: false,
        code: -1,
        stdout,
        stderr,
        message: "Agent manifest sync timed out after 60s",
      });
    }, 60_000);

    child.stdout?.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr?.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", (error) => {
      clearTimeout(timer);
      resolve({ ok: false, code: -1, stdout, stderr, message: error.message });
    });
    child.on("exit", (code) => {
      clearTimeout(timer);
      resolve({
        ok: code === 0,
        code,
        stdout,
        stderr,
        message: code === 0 ? "Agent manifest synced" : `Agent manifest sync failed (code ${code})`,
      });
    });
  });
}

function createAgentManifestSyncMiddleware(options = {}) {
  let syncInFlight = null;

  return async function agentManifestSyncMiddleware(req, res, next) {
    try {
      const url = new URL(req.url ?? "/", "http://127.0.0.1");
      if (url.pathname !== "/api/agent/manifest-sync") return next();

      if (req.method === "OPTIONS") {
        res.statusCode = 204;
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type");
        res.end();
        return;
      }

      if (req.method && req.method !== "POST") {
        res.statusCode = 405;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ ok: false, message: "Method not allowed" }));
        return;
      }

      const cwd = options.cwd || process.cwd();
      if (!syncInFlight) {
        syncInFlight = runAgentManifestSync(cwd).finally(() => {
          syncInFlight = null;
        });
      }
      const payload = await syncInFlight;
      res.statusCode = payload.ok ? 200 : 500;
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.end(JSON.stringify(payload));
    } catch (e) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(
        JSON.stringify({
          ok: false,
          message: e instanceof Error ? e.message : String(e),
        }),
      );
    }
  };
}

module.exports = {
  runAgentManifestSync,
  createAgentManifestSyncMiddleware,
};
