const http = require("node:http");
const path = require("node:path");
const fs = require("node:fs");
const { spawn } = require("node:child_process");
const { URL } = require("node:url");

const HOST = "127.0.0.1";
const PORT = 5190;
const configPath = path.resolve(__dirname, "..", "public", "tools-launch.json");
const running = new Map();

function isProcessAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function pruneRunning() {
  for (const [id, pid] of running.entries()) {
    if (!isProcessAlive(pid)) running.delete(id);
  }
}

function healthPayload() {
  pruneRunning();
  const config = loadConfig();
  return {
    ok: true,
    port: PORT,
    configured: Object.keys(config),
    running: [...running.entries()].map(([id, pid]) => ({
      id,
      pid,
      devUrl: config[id]?.devUrl ?? null,
    })),
  };
}

function loadConfig() {
  return JSON.parse(fs.readFileSync(configPath, "utf8"));
}

function sendJson(res, status, data) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(JSON.stringify(data));
}

function sendHtml(res, status, title, body) {
  res.writeHead(status, { "Content-Type": "text/html; charset=utf-8" });
  res.end(`<!DOCTYPE html><html lang="vi"><head><meta charset="utf-8"/><title>${title}</title>
<style>body{font-family:Segoe UI,system-ui;margin:2rem;background:#0b1220;color:#e8eefc}
.ok{color:#6ee7b7}.bad{color:#fca5a5}code{background:#1e293b;padding:.2rem .4rem;border-radius:4px}</style></head>
<body><h1>${title}</h1>${body}</body></html>`);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      try {
        const raw = Buffer.concat(chunks).toString("utf8");
        resolve(raw ? JSON.parse(raw) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

function launchTool(id, entry) {
  if (running.has(id)) {
    return { ok: true, message: `${id} is already running (PID ${running.get(id)})` };
  }
  if (!entry?.cwd || !entry?.command) {
    return { ok: false, message: "Missing launch configuration" };
  }
  if (!fs.existsSync(entry.cwd)) {
    return { ok: false, message: `Directory not found: ${entry.cwd}` };
  }

  const child = spawn(entry.command, {
    cwd: entry.cwd,
    shell: true,
    detached: true,
    stdio: "ignore",
    windowsHide: false,
  });
  child.unref();
  running.set(id, child.pid);
  child.on("exit", () => running.delete(id));

  return {
    ok: true,
    message: `Started <strong>${id}</strong> (PID ${child.pid})<br/>Command: <code>${entry.command}</code><br/>Folder: <code>${entry.cwd}</code>`,
  };
}

function runWorkspaceScan() {
  return new Promise((resolve) => {
    const child = spawn("corepack", ["pnpm", "scan:local"], {
      cwd: path.resolve(__dirname, ".."),
      shell: process.platform === "win32",
      windowsHide: true,
    });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill();
      resolve({ ok: false, code: -1, stdout, stderr, message: "Workspace scan timed out after 120s" });
    }, 120_000);

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
        message: code === 0 ? "Workspace scan completed" : `Workspace scan failed with code ${code}`,
      });
    });
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://${HOST}:${PORT}`);

  if (req.method === "OPTIONS") {
    return sendJson(res, 204, {});
  }

  if (req.method === "GET" && url.pathname === "/health") {
    return sendJson(res, 200, healthPayload());
  }

  if (req.method === "GET" && url.pathname === "/") {
    const config = loadConfig();
    const health = healthPayload();
    const runningIds = new Set(health.running.map((item) => item.id));
    const items = Object.keys(config)
      .map((id) => {
        const live = runningIds.has(id) ? ' <span class="ok">(running)</span>' : "";
        return `<li><a href="/launch?id=${encodeURIComponent(id)}">${id}</a>${live}</li>`;
      })
      .join("");
    const runningLine =
      health.running.length > 0
        ? `<p>Running: ${health.running.map((item) => `<code>${item.id}</code> (PID ${item.pid})`).join(", ")}</p>`
        : "<p>No tools are running from the launcher.</p>";
    return sendHtml(
      res,
      200,
      "GTM Launcher",
      `<p class="ok">Launcher is running on port ${PORT}.</p>${runningLine}<p>Launch tool:</p><ul>${items}</ul>`,
    );
  }

  if (req.method === "POST" && url.pathname === "/version-pipeline") {
    try {
      const body = await readBody(req);
      const { runPipeline } = require("./version-pipeline-run.cjs");
      const cwd = String(body.cwd ?? "");
      const version = String(body.version ?? "");
      const branch = String(body.branch ?? "main");
      const bumpOnCommit = body.bumpOnCommit !== false;
      const commitTitle = String(body.commitTitle ?? body.commitMessage ?? "");
      let actions = body.actions;
      if (!Array.isArray(actions)) {
        const single = String(body.action ?? "all");
        actions =
          single === "all" ? ["sync", "commit", "push"] : single === "sync" || single === "commit" || single === "push" ? [single] : [];
      }
      if (!cwd) {
        return sendJson(res, 400, { ok: false, message: "Missing cwd (localPath)" });
      }
      const result = runPipeline({ cwd, version, branch, actions, bumpOnCommit, commitTitle });
      return sendJson(res, result.ok ? 200 : 500, result);
    } catch (error) {
      return sendJson(res, 500, { ok: false, message: error.message, steps: [] });
    }
  }

  if (req.method === "POST" && url.pathname === "/scan-workspace") {
    try {
      const result = await runWorkspaceScan();
      return sendJson(res, result.ok ? 200 : 500, result);
    } catch (error) {
      return sendJson(res, 500, { ok: false, message: error.message, stdout: "", stderr: "" });
    }
  }

  if ((req.method === "GET" || req.method === "POST") && url.pathname === "/launch") {
    try {
      const config = loadConfig();
      let id = url.searchParams.get("id") ?? "";
      if (req.method === "POST" && !id) {
        const body = await readBody(req);
        id = String(body.id ?? "");
      }
      const entry = config[id];
      if (!entry) {
        if (req.method === "POST") {
          return sendJson(res, 404, { ok: false, message: `No launch configuration for: ${id}` });
        }
        return sendHtml(res, 404, "Not found", `<p class="bad">Not configured: ${id}</p>`);
      }
      const result = launchTool(id, entry);
      if (req.method === "POST") {
        return sendJson(res, 200, result);
      }
      const klass = result.ok ? "ok" : "bad";
      return sendHtml(
        res,
        200,
        result.ok ? "Started" : "Error",
        `<p class="${klass}">${result.message}</p><p>You can close this tab.</p><script>setTimeout(()=>window.close(),4000)</script>`,
      );
    } catch (error) {
      if (req.method === "POST") {
        return sendJson(res, 500, { ok: false, message: error.message });
      }
      return sendHtml(res, 500, "Error", `<p class="bad">${error.message}</p>`);
    }
  }

  sendJson(res, 404, { ok: false, message: "Not found" });
});

server.listen(PORT, HOST, () => {
  console.log(`\n  GTM Local Tool Launcher\n  -> http://${HOST}:${PORT}\n  -> Opened from https://infix1.io.vn via the Launch tool button\n`);
});
