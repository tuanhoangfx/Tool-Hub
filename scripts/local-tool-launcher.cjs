const http = require("node:http");
const path = require("node:path");
const fs = require("node:fs");
const { spawn } = require("node:child_process");

const HOST = "127.0.0.1";
const PORT = 5190;
const configPath = path.resolve(__dirname, "..", "public", "tools-launch.json");
const running = new Map();

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

  return { ok: true, message: `Đã khởi chạy ${id} (PID ${child.pid})` };
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    return sendJson(res, 204, {});
  }

  if (req.method === "GET" && req.url === "/health") {
    return sendJson(res, 200, { ok: true, port: PORT });
  }

  if (req.method === "POST" && req.url === "/launch") {
    try {
      const body = await readBody(req);
      const config = loadConfig();
      const id = String(body.id ?? "");
      const entry = config[id];
      if (!entry) {
        return sendJson(res, 404, { ok: false, message: `Chưa cấu hình launch cho: ${id}` });
      }
      return sendJson(res, 200, launchTool(id, entry));
    } catch (error) {
      return sendJson(res, 500, { ok: false, message: error.message });
    }
  }

  sendJson(res, 404, { ok: false, message: "Not found" });
});

server.listen(PORT, HOST, () => {
  console.log(`\n  GTM Local Tool Launcher\n  → http://${HOST}:${PORT}\n`);
});
