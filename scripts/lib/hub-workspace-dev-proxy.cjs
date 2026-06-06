/**
 * Dev-only workspace dev launcher.
 *
 * POST /api/workspace-dev/start-down     → all down tools (ensure-dev --stack workspace --down-only)
 * POST /api/workspace-dev/start-product  → one tool `{ code: "P0016" }`
 * GET  /api/workspace-dev/status       → batch start-down job status
 */
const { spawn } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const { getProductConfig } = require("../../../scripts/lib/ensure-dev-core.cjs");

let starting = false;
const startingProducts = new Set();

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      try {
        const raw = Buffer.concat(chunks).toString("utf8");
        resolve(raw ? JSON.parse(raw) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}

function hubRoot() {
  return path.resolve(__dirname, "..", "..");
}

function statePath() {
  return path.join(hubRoot(), ".workspace-dev-start.json");
}

function logPath() {
  return path.join(hubRoot(), "workspace-dev-start.log");
}

function readState() {
  try {
    return JSON.parse(fs.readFileSync(statePath(), "utf8"));
  } catch {
    return { running: false };
  }
}

function writeState(patch) {
  const next = { ...readState(), ...patch, updatedAt: new Date().toISOString() };
  fs.writeFileSync(statePath(), JSON.stringify(next, null, 2), "utf8");
}

function productLogPath(code) {
  return path.join(hubRoot(), `workspace-dev-start-${code}.log`);
}

function spawnEnsureProduct(code) {
  const ensureScript = path.resolve(hubRoot(), "..", "scripts", "ensure-dev-product.cjs");
  const logFile = productLogPath(code);
  fs.appendFileSync(logFile, `\n--- start-product ${code} ${new Date().toISOString()} ---\n`);
  const out = fs.openSync(logFile, "a");
  const child = spawn(process.execPath, [ensureScript, code], {
    detached: true,
    stdio: ["ignore", out, out],
    windowsHide: true,
  });
  child.unref();
  child.on("exit", () => {
    startingProducts.delete(code);
  });
}

function createHubWorkspaceDevMiddleware() {
  const ensureScript = path.resolve(hubRoot(), "..", "scripts", "ensure-dev-product.cjs");

  return async (req, res, next) => {
    const url = req.url?.split("?")[0] ?? "";

    if (req.method === "GET" && url === "/api/workspace-dev/status") {
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Cache-Control", "no-store");
      res.end(JSON.stringify({ ...readState(), logFile: path.basename(logPath()) }));
      return;
    }

    if (req.method === "POST" && url === "/api/workspace-dev/start-product") {
      let body;
      try {
        body = await readBody(req);
      } catch {
        res.statusCode = 400;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ ok: false, message: "Invalid JSON body" }));
        return;
      }

      const code = String(body.code || "").toUpperCase();
      const config = getProductConfig(code);
      if (!config) {
        res.statusCode = 400;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ ok: false, message: `Unknown product code: ${code || "(empty)"}` }));
        return;
      }

      if (startingProducts.has(code)) {
        res.statusCode = 409;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ ok: false, message: `${code} dev start already in progress` }));
        return;
      }

      startingProducts.add(code);
      spawnEnsureProduct(code);

      res.statusCode = 202;
      res.setHeader("Content-Type", "application/json");
      res.end(
        JSON.stringify({
          ok: true,
          code,
          message: `Starting ${code} dev server (${config.probeUrl}). Use Local health to refresh.`,
        }),
      );
      return;
    }

    if (req.method !== "POST" || url !== "/api/workspace-dev/start-down") {
      next();
      return;
    }

    if (starting || readState().running) {
      res.statusCode = 409;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ ok: false, message: "Workspace dev start already in progress" }));
      return;
    }

    starting = true;
    writeState({ running: true, startedAt: new Date().toISOString(), exitCode: null });

    res.statusCode = 202;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        ok: true,
        message:
          "Starting all down workspace dev servers (no browser tabs). Use Local health to refresh status in ~1–2 min.",
      }),
    );

    fs.appendFileSync(logPath(), `\n--- workspace start-down ${new Date().toISOString()} ---\n`);

    const out = fs.openSync(logPath(), "a");
    const child = spawn(
      process.execPath,
      [ensureScript, "--stack", "workspace", "--down-only"],
      {
        detached: true,
        stdio: ["ignore", out, out],
        windowsHide: true,
      },
    );
    child.unref();

    child.on("exit", (code) => {
      starting = false;
      writeState({ running: false, exitCode: code ?? 1 });
    });
  };
}

module.exports = { createHubWorkspaceDevMiddleware };
