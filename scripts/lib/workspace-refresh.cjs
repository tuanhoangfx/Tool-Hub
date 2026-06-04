"use strict";

const path = require("node:path");
const { spawn } = require("node:child_process");

function runWorkspaceCommand(cwd, args, successMessage, failureMessage, timeoutMs = 120_000) {
  return new Promise((resolve) => {
    const child = spawn("corepack", args, {
      cwd,
      shell: process.platform === "win32",
      windowsHide: true,
    });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill();
      resolve({ ok: false, code: -1, stdout, stderr, message: `Timed out after ${timeoutMs / 1000}s` });
    }, timeoutMs);

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
        message: code === 0 ? successMessage : `${failureMessage} with code ${code}`,
      });
    });
  });
}

function hubRootFromCwd(cwd) {
  return path.resolve(cwd);
}

async function runWorkspaceScan(cwd = process.cwd()) {
  const root = hubRootFromCwd(cwd);
  return runWorkspaceCommand(root, ["pnpm", "scan:local"], "Workspace scan completed", "Workspace scan failed");
}

async function runGitHubCheck(cwd = process.cwd()) {
  const root = hubRootFromCwd(cwd);
  return runWorkspaceCommand(
    root,
    ["pnpm", "sync:workspace:dry"],
    "GitHub check completed",
    "GitHub check failed",
    180_000,
  );
}

async function runWorkspaceRefresh(cwd = process.cwd()) {
  const { runAgentManifestSync } = require("./agent-manifest-sync.cjs");
  const scan = await runWorkspaceScan(cwd);
  const github = scan.ok
    ? await runGitHubCheck(cwd)
    : { ok: false, code: -1, stdout: "", stderr: "", message: "Skipped GitHub check because workspace scan failed" };
  const manifest = await runAgentManifestSync(cwd);
  const ok = scan.ok && github.ok && manifest.ok;
  return {
    ok,
    code: ok ? 0 : scan.code || github.code || manifest.code || 1,
    message: ok
      ? "Workspace refresh completed (incl. agent manifest)"
      : [scan.message, github.message, manifest.message].filter(Boolean).join("; "),
    scan,
    github,
    manifest,
    stdout: [scan.stdout, github.stdout, manifest.stdout].filter(Boolean).join("\n"),
    stderr: [scan.stderr, github.stderr, manifest.stderr].filter(Boolean).join("\n"),
  };
}

function createWorkspaceRefreshMiddleware(options = {}) {
  let refreshInFlight = null;

  return async function workspaceRefreshMiddleware(req, res, next) {
    try {
      const url = new URL(req.url ?? "/", "http://127.0.0.1");
      const isScan = url.pathname === "/api/workspace/scan";
      const isRefresh = url.pathname === "/api/workspace/refresh";
      if (!isScan && !isRefresh) return next();

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

      if (isScan) {
        const payload = await runWorkspaceScan(cwd);
        res.statusCode = payload.ok ? 200 : 500;
        res.setHeader("Content-Type", "application/json");
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.end(JSON.stringify(payload));
        return;
      }

      if (!refreshInFlight) {
        refreshInFlight = runWorkspaceRefresh(cwd).finally(() => {
          refreshInFlight = null;
        });
      }
      const payload = await refreshInFlight;
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
  runWorkspaceScan,
  runGitHubCheck,
  runWorkspaceRefresh,
  createWorkspaceRefreshMiddleware,
};
