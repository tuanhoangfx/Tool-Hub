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
    return { ok: true, message: `${id} đang chạy (PID ${running.get(id)})` };
  }
  if (!entry?.cwd || !entry?.command) {
    return { ok: false, message: "Thiếu cấu hình launch" };
  }
  if (!fs.existsSync(entry.cwd)) {
    return { ok: false, message: `Không tìm thấy thư mục: ${entry.cwd}` };
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

  return { ok: true, message: `Đã khởi chạy <strong>${id}</strong> (PID ${child.pid})<br/>Lệnh: <code>${entry.command}</code><br/>Thư mục: <code>${entry.cwd}</code>` };
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
        const live = runningIds.has(id) ? ' <span class="ok">(đang chạy)</span>' : "";
        return `<li><a href="/launch?id=${encodeURIComponent(id)}">${id}</a>${live}</li>`;
      })
      .join("");
    const runningLine =
      health.running.length > 0
        ? `<p>Đang chạy: ${health.running.map((item) => `<code>${item.id}</code> (PID ${item.pid})`).join(", ")}</p>`
        : "<p>Chưa có tool nào đang chạy từ launcher.</p>";
    return sendHtml(
      res,
      200,
      "GTM Launcher",
      `<p class="ok">Launcher đang chạy trên cổng ${PORT}.</p>${runningLine}<p>Chạy tool:</p><ul>${items}</ul>`,
    );
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
          return sendJson(res, 404, { ok: false, message: `Chưa cấu hình launch cho: ${id}` });
        }
        return sendHtml(res, 404, "Không tìm thấy", `<p class="bad">Chưa cấu hình: ${id}</p>`);
      }
      const result = launchTool(id, entry);
      if (req.method === "POST") {
        return sendJson(res, 200, result);
      }
      const klass = result.ok ? "ok" : "bad";
      return sendHtml(
        res,
        200,
        result.ok ? "Đã chạy" : "Lỗi",
        `<p class="${klass}">${result.message}</p><p>Có thể đóng tab này.</p><script>setTimeout(()=>window.close(),4000)</script>`,
      );
    } catch (error) {
      if (req.method === "POST") {
        return sendJson(res, 500, { ok: false, message: error.message });
      }
      return sendHtml(res, 500, "Lỗi", `<p class="bad">${error.message}</p>`);
    }
  }

  sendJson(res, 404, { ok: false, message: "Not found" });
});

server.listen(PORT, HOST, () => {
  console.log(`\n  GTM Local Tool Launcher\n  → http://${HOST}:${PORT}\n  → Mở từ https://infix1.io.vn: dùng nút Chạy tool (mở tab này)\n`);
});
