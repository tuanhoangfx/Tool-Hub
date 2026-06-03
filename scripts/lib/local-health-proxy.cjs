const http = require("node:http");
const https = require("node:https");

const PROBE_TIMEOUT_MS = 2000;

function probeOne(url) {
  return new Promise((resolve) => {
    let parsed;
    try {
      parsed = new URL(url);
    } catch {
      resolve({ url, ok: false, error: "invalid-url" });
      return;
    }
    if (!["127.0.0.1", "localhost", "::1"].includes(parsed.hostname)) {
      resolve({ url, ok: false, error: "host-not-allowed" });
      return;
    }
    const lib = parsed.protocol === "https:" ? https : http;
    const req = lib.get(url, (res) => {
      res.resume();
      resolve({ url, ok: res.statusCode != null && res.statusCode < 500, status: res.statusCode });
    });
    req.on("error", (err) => resolve({ url, ok: false, error: err.code || "error" }));
    req.setTimeout(PROBE_TIMEOUT_MS, () => {
      req.destroy();
      resolve({ url, ok: false, error: "timeout" });
    });
  });
}

function createLocalHealthMiddleware() {
  return (req, res, next) => {
    if (req.method !== "GET" || !req.url?.startsWith("/api/local-health")) {
      next();
      return;
    }
    const q = new URL(req.url, "http://127.0.0.1");
    const raw = q.searchParams.get("urls") || q.searchParams.get("url") || "";
    const urls = raw
      .split(",")
      .map((u) => u.trim())
      .filter(Boolean)
      .slice(0, 40);
    if (!urls.length) {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "missing urls query param" }));
      return;
    }
    void Promise.all(urls.map(probeOne)).then((results) => {
      const map = {};
      for (const r of results) map[r.url] = r.ok ? "online" : "offline";
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Cache-Control", "no-store");
      res.end(JSON.stringify({ results: map, probedAt: new Date().toISOString() }));
    });
  };
}

module.exports = { createLocalHealthMiddleware, probeOne };
