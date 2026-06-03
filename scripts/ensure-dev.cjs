/**
 * Ensure Tool Hub Vite (port 5176) is listening.
 * Reuses a healthy server — never kills a working dev process.
 *
 * Usage:
 *   node scripts/ensure-dev.cjs           # start in background if needed
 *   node scripts/ensure-dev.cjs --open    # + open browser
 *   node scripts/ensure-dev.cjs --force   # kill port + restart
 *   node scripts/ensure-dev.cjs --foreground  # attach Vite to this terminal (no detach)
 */
const { spawn, execSync } = require("node:child_process");
const path = require("node:path");
const fs = require("node:fs");
const http = require("node:http");

const root = path.resolve(__dirname, "..");
const PORT = 5176;
const HOST = "127.0.0.1";
const URL = `http://${HOST}:${PORT}/?screen=library`;
const PROBE_URL = `http://${HOST}:${PORT}/`;
const LOG_FILE = path.join(root, "dev-server.log");
const PID_FILE = path.join(root, ".dev-vite.pid");

const open = process.argv.includes("--open");
const force = process.argv.includes("--force");
const foreground = process.argv.includes("--foreground");

function log(msg) {
  console.log(`[P0004] ${msg}`);
}

function probe(url, timeoutMs = 1200) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      res.resume();
      resolve(res.statusCode != null && res.statusCode < 500);
    });
    req.on("error", () => resolve(false));
    req.setTimeout(timeoutMs, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function waitReady(timeoutMs = 45_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await probe(PROBE_URL)) return true;
    await new Promise((r) => setTimeout(r, 400));
  }
  return false;
}

function openBrowser() {
  if (process.platform === "win32") {
    spawn("cmd", ["/c", "start", "", URL], { detached: true, stdio: "ignore" }).unref();
  } else {
    const cmd = process.platform === "darwin" ? "open" : "xdg-open";
    spawn(cmd, [URL], { detached: true, stdio: "ignore" }).unref();
  }
}

function killPort() {
  execSync(`node "${path.join(__dirname, "kill-port.cjs")}" ${PORT}`, {
    cwd: root,
    stdio: "inherit",
  });
}

function readPid() {
  try {
    const raw = fs.readFileSync(PID_FILE, "utf8").trim();
    const pid = Number(raw);
    return Number.isFinite(pid) && pid > 0 ? pid : null;
  } catch {
    return null;
  }
}

function writePid(pid) {
  try {
    fs.writeFileSync(PID_FILE, String(pid));
  } catch {
    /* optional */
  }
}

function isPidAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function viteBin() {
  return path.join(root, "node_modules", "vite", "bin", "vite.js");
}

function startBackground() {
  log(`Starting Vite in background (log: ${path.relative(root, LOG_FILE)})…`);
  const out = fs.openSync(LOG_FILE, "a");
  fs.writeFileSync(
    LOG_FILE,
    `\n--- ensure-dev ${new Date().toISOString()} ---\n`,
    { flag: "a" },
  );

  const child = spawn(process.execPath, [viteBin(), "--host", HOST, "--port", String(PORT)], {
    cwd: root,
    detached: true,
    stdio: ["ignore", out, out],
    windowsHide: true,
    env: { ...process.env, FORCE_COLOR: "0" },
  });
  child.unref();
  writePid(child.pid);
  return child.pid;
}

function startForeground() {
  log("Starting Vite in this terminal…");
  const child = spawn(process.execPath, [viteBin(), "--host", HOST, "--port", String(PORT)], {
    cwd: root,
    stdio: "inherit",
    env: process.env,
  });
  writePid(child.pid);
  return new Promise((resolve, reject) => {
    child.on("error", reject);
    child.on("exit", (code) => {
      try {
        fs.unlinkSync(PID_FILE);
      } catch {
        /* ignore */
      }
      process.exit(code ?? 0);
    });
    void waitReady().then((ok) => {
      if (ok) {
        log(`Tool Hub ready → ${URL}`);
        if (open) openBrowser();
        resolve();
      } else {
        reject(new Error(`Timed out waiting for Vite on port ${PORT}`));
      }
    });
  });
}

async function main() {
  if (force) {
    log("--force: freeing port before restart…");
    killPort();
    try {
      fs.unlinkSync(PID_FILE);
    } catch {
      /* ignore */
    }
  } else if (await probe(PROBE_URL)) {
    log(`Server OK — ${PROBE_URL}`);
    if (open) openBrowser();
    return;
  } else {
    const pid = readPid();
    if (pid && isPidAlive(pid)) {
      log(`Vite PID ${pid} still starting — waiting…`);
      if (await waitReady(20_000)) {
        log(`Server OK — ${PROBE_URL}`);
        if (open) openBrowser();
        return;
      }
      log("Stale PID — port not responding; starting fresh…");
    }
  }

  if (foreground) {
    await startForeground();
    return;
  }

  startBackground();

  if (await waitReady()) {
    log(`Tool Hub ready → ${URL}`);
    if (open) openBrowser();
    return;
  }

  console.error(
    `[P0004] Server did not respond in time. Check ${path.relative(root, LOG_FILE)} for errors.`,
  );
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
