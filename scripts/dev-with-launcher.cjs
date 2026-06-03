const { spawn } = require("node:child_process");
const path = require("node:path");
const http = require("node:http");

const root = path.resolve(__dirname, "..");
const launcherScript = path.join(__dirname, "local-tool-launcher.cjs");
const LAUNCHER_PORT = 5190;
const VITE_PORT = 5176;
const DEV_URL = "http://127.0.0.1:5176/?screen=library";

function waitForHttp(port, path = "/", maxMs = 30000) {
  const started = Date.now();
  return new Promise((resolve) => {
    const tick = () => {
      const req = http.get(`http://127.0.0.1:${port}${path}`, (res) => {
        res.resume();
        if (res.statusCode && res.statusCode < 500) resolve(true);
        else if (Date.now() - started > maxMs) resolve(false);
        else setTimeout(tick, 400);
      });
      req.on("error", () => {
        if (Date.now() - started > maxMs) resolve(false);
        else setTimeout(tick, 400);
      });
    };
    tick();
  });
}

function openBrowser(url) {
  if (process.env.OPEN_BROWSER === "0") return;
  if (process.platform === "win32") {
    spawn("cmd", ["/c", "start", "", url], { detached: true, stdio: "ignore" }).unref();
    return;
  }
  const cmd = process.platform === "darwin" ? "open" : "xdg-open";
  spawn(cmd, [url], { detached: true, stdio: "ignore" }).unref();
}

async function main() {
  const viteAlreadyUp = await waitForHttp(VITE_PORT, "/", 1200);
  if (viteAlreadyUp) {
    console.log(`\n  Vite already running → ${DEV_URL}\n`);
  } else if (process.argv.includes("--force")) {
    try {
      require("node:child_process").execSync("node scripts/kill-port.cjs 5176", {
        cwd: root,
        stdio: "inherit",
      });
    } catch {
      /* ignore */
    }
  }

  console.log("\n  Tool Hub dev — starting launcher + Vite\n");

  const launcher = spawn(process.execPath, [launcherScript], {
    cwd: root,
    stdio: "inherit",
    env: process.env,
    detached: process.platform === "win32",
  });

  if (process.platform === "win32") {
    launcher.unref();
  }

  const launcherReady = await waitForHttp(LAUNCHER_PORT, "/health", 12000);
  if (launcherReady) {
    console.log(`  Launcher ready → http://127.0.0.1:${LAUNCHER_PORT}/\n`);
  } else {
    console.warn("  Launcher chưa phản hồi — vẫn chạy Vite.\n");
  }

  let vite = null;
  if (!viteAlreadyUp) {
    vite = spawn(
      process.execPath,
      [path.join(root, "node_modules", "vite", "bin", "vite.js"), "--host", "127.0.0.1", "--port", String(VITE_PORT)],
      {
        cwd: root,
        stdio: "inherit",
        env: process.env,
      },
    );

    void waitForHttp(VITE_PORT, "/", 30000).then((viteReady) => {
      if (viteReady) {
        console.log(`\n  Vite ready → ${DEV_URL}\n`);
        openBrowser(DEV_URL);
      } else {
        console.warn("\n  Vite chưa phản hồi trong 30s — mở tay URL trên khi sẵn sàng.\n");
      }
    });
  } else {
    openBrowser(DEV_URL);
  }

  const shutdown = () => {
    try {
      vite?.kill();
    } catch {
      // ignore
    }
    try {
      launcher.kill();
    } catch {
      // ignore
    }
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  if (vite) {
    vite.on("exit", (code) => {
      try {
        launcher.kill();
      } catch {
        // ignore
      }
      process.exit(code ?? 0);
    });
  } else {
    launcher.on("exit", () => process.exit(0));
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
