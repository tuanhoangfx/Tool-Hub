const fs = require("node:fs");
const path = require("node:path");

const ICON_SLUGS = [
  "react",
  "typescript",
  "vite",
  "javascript",
  "npm",
  "github",
  "github-actions",
  "electron",
  "ffmpeg",
  "youtube",
  "zalo",
  "pnpm",
  "docker",
  "java",
  "google",
  "openrouter",
  "openai",
  "material-ui",
  "mui",
  "vercel",
  "microsoft",
  "figma",
  "playwright",
];

const outDir = path.resolve(__dirname, "..", "public", "icons");

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  let ok = 0;
  let fail = 0;

  for (const slug of ICON_SLUGS) {
    const url = `https://thesvg.org/icons/${slug}/default.svg`;
    const dest = path.join(outDir, `${slug}.svg`);
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const body = await response.text();
      fs.writeFileSync(dest, body, "utf8");
      ok += 1;
      console.log(`OK  ${slug}`);
    } catch (error) {
      fail += 1;
      console.warn(`FAIL ${slug}: ${error.message}`);
    }
  }

  console.log(`\nWrote ${ok} icons to ${outDir} (${fail} failed)`);
}

main();
