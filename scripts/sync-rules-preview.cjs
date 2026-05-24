const fs = require("node:fs");
const path = require("node:path");

const rulesRoot = process.env.RULES_ROOT || path.resolve("E:\\Dev\\Rules");
const outDir = path.resolve(__dirname, "..", "public", "rules");

const copies = [
  {
    from: path.join(rulesRoot, "rules", "Working_Rules.md"),
    to: "working-rules.md",
  },
  {
    from: path.join(rulesRoot, "standards", "Workspace_Design_Standard.md"),
    to: "workspace-design-standard.md",
  },
  {
    from: path.join(rulesRoot, "templates", "tool-docs", "CHANGELOG_ENTRY_TEMPLATE.md"),
    to: "changelog-entry-template.md",
  },
];

function main() {
  fs.mkdirSync(outDir, { recursive: true });

  for (const item of copies) {
    if (!fs.existsSync(item.from)) {
      console.warn(`SKIP ${item.to} (missing ${item.from})`);
      continue;
    }
    fs.copyFileSync(item.from, path.join(outDir, item.to));
    console.log(`OK  ${item.to}`);
  }

  const designNote = [
    "# Design baseline (Tool Hub)",
    "",
    "Tool Hub inlines design tokens in `src/styles.css` (no runtime import from Rules CSS).",
    "",
    "Local source path:",
    "`E:\\\\Dev\\\\Tool\\\\P0004-Tool-Hub\\\\src\\\\styles.css`",
    "",
  ].join("\n");
  fs.writeFileSync(path.join(outDir, "design-base.md"), designNote, "utf8");
  console.log("OK  design-base.md (generated)");
}

main();
