/**
 * Dev-only: POST /api/hub-dev/recover — restart Tool Hub Vite after esbuild crash.
 */
const { spawn } = require("node:child_process");
const path = require("node:path");

let recovering = false;

function createHubDevRecoverMiddleware() {
  const recoverScript = path.resolve(__dirname, "..", "dev-recover.cjs");

  return (req, res, next) => {
    if (req.method !== "POST" || !req.url?.startsWith("/api/hub-dev/recover")) {
      next();
      return;
    }

    if (recovering) {
      res.statusCode = 409;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ ok: false, message: "Recover already in progress" }));
      return;
    }

    recovering = true;
    res.statusCode = 202;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        ok: true,
        message: "Restarting Tool Hub dev server (port 5176). Reload this tab in ~15s.",
      }),
    );

    const child = spawn(process.execPath, [recoverScript], {
      cwd: path.resolve(__dirname, "..", ".."),
      detached: true,
      stdio: "ignore",
      windowsHide: true,
    });
    child.unref();
    child.on("exit", () => {
      recovering = false;
    });
  };
}

module.exports = { createHubDevRecoverMiddleware };
