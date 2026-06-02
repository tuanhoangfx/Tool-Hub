/**
 * Start Tool Hub Vite (port 5176). Optional: --open
 */
const { spawn } = require("node:child_process");
const path = require("node:path");
const http = require("node:http");

const root = path.resolve(__dirname, "..");
const PORT = 5176;
const URL = `http://127.0.0.1:${PORT}/?screen=library`;

function probe(url, timeoutMs = 800) {
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

async function main() {
  const open = process.argv.includes("--open");
  if (await probe(URL)) {
    console.log(`Tool Hub already running → ${URL}`);
    if (open) spawn("cmd", ["/c", "start", "", URL], { detached: true, stdio: "ignore" });
    return;
  }

  const child = spawn("corepack", ["pnpm", "run", "dev:vite"], {
    cwd: root,
    shell: true,
    stdio: "inherit",
  });

  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    if (await probe(URL)) {
      console.log(`\nTool Hub ready → ${URL}\n`);
      if (open) spawn("cmd", ["/c", "start", "", URL], { detached: true, stdio: "ignore" });
      return;
    }
    await new Promise((r) => setTimeout(r, 400));
  }

  console.error("Timed out waiting for Vite on port", PORT);
  child.kill();
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
