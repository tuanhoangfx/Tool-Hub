const fs = require("node:fs");
const path = require("node:path");

/** Static review pages removed after icon design lock — return 410 in dev (SPA would else serve index.html). */
const GONE_PATHS = new Set(["/icons/tools/gallery.html"]);

function createLegacyPublicGoneMiddleware(publicDir) {
  const root = path.resolve(publicDir);
  return (req, res, next) => {
    const url = req.url?.split("?")[0] ?? "";
    if (GONE_PATHS.has(url)) {
      res.statusCode = 410;
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.end("Gone — icon review gallery removed. Use Tool Hub only.");
      return;
    }
    if (url.startsWith("/icons/tools/") && !url.endsWith(".svg")) {
      const file = path.join(root, url.replace(/^\//, ""));
      if (!fs.existsSync(file)) {
        res.statusCode = 404;
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        res.end("Not found");
        return;
      }
    }
    next();
  };
}

module.exports = { createLegacyPublicGoneMiddleware, GONE_PATHS };
