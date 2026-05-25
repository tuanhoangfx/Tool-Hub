const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { bumpAndSyncDocs, bumpPatch, extractLatestChangelogVersion, parseSemver } = require("./version-bump.cjs");

describe("version-bump", () => {
  it("bumpPatch increments patch", () => {
    assert.equal(bumpPatch("0.1.0"), "0.1.1");
    assert.equal(bumpPatch("v1.2.9"), "1.2.10");
  });

  it("parseSemver strips v prefix", () => {
    assert.deepEqual(parseSemver("v0.1.0"), { major: 0, minor: 1, patch: 0 });
  });

  it("extractLatestChangelogVersion reads the first changelog version", () => {
    const text = [
      "# Changelog",
      "",
      "## 2026-05-25 - Current",
      "",
      "- Version: `0.2.0`",
      "",
      "---",
      "## 2026-05-24 - Previous",
      "",
      "- Version: `0.1.9`",
    ].join("\n");

    assert.equal(extractLatestChangelogVersion(text), "0.2.0");
  });

  it("runPipeline sync uses CHANGELOG before package when syncing docs", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "tool-hub-version-"));
    const cwd = path.join(root, "PTEST");
    fs.mkdirSync(cwd);

    try {
      fs.writeFileSync(path.join(cwd, "package.json"), `${JSON.stringify({ version: "0.1.0" }, null, 2)}\n`);
      fs.writeFileSync(
        path.join(cwd, "tool.manifest.json"),
        `${JSON.stringify({ release: { version: "0.1.0" } }, null, 2)}\n`,
      );
      fs.writeFileSync(
        path.join(cwd, "CHANGELOG.md"),
        ["# Changelog", "", "## 2026-05-25 - Latest", "", "- Version: `0.2.0`", ""].join("\n"),
      );

      process.env.TOOL_WORKSPACE_ROOT = root;
      const pipelinePath = require.resolve("../version-pipeline-run.cjs");
      delete require.cache[pipelinePath];
      const { runPipeline } = require("../version-pipeline-run.cjs");

      const result = runPipeline({ cwd, version: "0.1.0", actions: ["sync"] });
      const pkg = JSON.parse(fs.readFileSync(path.join(cwd, "package.json"), "utf8"));
      const manifest = JSON.parse(fs.readFileSync(path.join(cwd, "tool.manifest.json"), "utf8"));

      assert.equal(result.ok, true);
      assert.equal(result.version, "0.2.0");
      assert.equal(pkg.version, "0.2.0");
      assert.equal(manifest.release.version, "0.2.0");
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it("bumpAndSyncDocs bumps from CHANGELOG before package for git commits", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "tool-hub-bump-"));

    try {
      fs.writeFileSync(path.join(root, "package.json"), `${JSON.stringify({ version: "0.1.0" }, null, 2)}\n`);
      fs.writeFileSync(
        path.join(root, "tool.manifest.json"),
        `${JSON.stringify({ release: { version: "0.1.0" } }, null, 2)}\n`,
      );
      fs.writeFileSync(
        path.join(root, "CHANGELOG.md"),
        ["# Changelog", "", "## 2026-05-25 - Latest", "", "- Version: `0.2.0`", ""].join("\n"),
      );

      const result = bumpAndSyncDocs(root, { title: "Commit bump" });
      const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
      const manifest = JSON.parse(fs.readFileSync(path.join(root, "tool.manifest.json"), "utf8"));
      const changelog = fs.readFileSync(path.join(root, "CHANGELOG.md"), "utf8");

      assert.deepEqual(result, { previousVersion: "0.2.0", version: "0.2.1" });
      assert.equal(pkg.version, "0.2.1");
      assert.equal(manifest.release.version, "0.2.1");
      assert.match(changelog, /- Version: `0\.2\.1`/);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
});
