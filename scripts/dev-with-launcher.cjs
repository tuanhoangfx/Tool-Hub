const { spawn } = require("node:child_process");
const path = require("node:path");
const http = require("node:http");

const root = path.resolve(__dirname, "..");
const launcherScript = path.join(__dirname, "local-tool-launcher.cjs");
const PORT = 5190;

function waitForHealth(maxMs = 12000) {
  const started = Date.now();
  return new Promise((resolve) => {
    const tick = () => {
      const req = http.get(`http://127.0.0.1:${PORT}/health`, (res) => {
        res.resume();
        if (res.statusCode === 200) resolve(true);
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

async function main() {
  console.log("\n  GTM dev — starting launcher + Vite\n");

  const launcher = spawn(process.execPath, [launcherScript], {
    cwd: root,
    stdio: "inherit",
    env: process.env,
    detached: process.platform === "win32",
  });

  if (process.platform === "win32") {
    launcher.unref();
  }

  const ready = await waitForHealth();
  if (ready) {
    console.log(`  Launcher ready → http://127.0.0.1:${PORT}/\n`);
  } else {
    console.warn("  Launcher chưa phản hồi — vẫn chạy Vite. Thử launch.bat nếu cần Chạy tool.\n");
  }

  const vite = spawn("corepack", ["pnpm", "exec", "vite", "--host", "127.0.0.1", "--port", "5176"], {
    cwd: root,
    stdio: "inherit",
    shell: process.platform === "win32",
    env: process.env,
  });

  const shutdown = () => {
    try {
      vite.kill();
    } catch {
      // ignore: process may already be dead
    }
    try {
      launcher.kill();
    } catch {
      // ignore: process may already be dead
    }
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  vite.on("exit", (code) => {
    try {
      launcher.kill();
    } catch {
      // ignore: process may already be dead
    }
    process.exit(code ?? 0);
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
