import { describe, expect, it } from "vitest";
import { collectVersionHistory } from "./tool-versions";
import type { ResolvedTool, ToolManifest } from "../../types";

const baseTool: ResolvedTool = {
  id: "p0001",
  code: "P0001",
  name: "Test Tool",
  repo: "org/repo",
  branch: "main",
  category: "Web",
  audience: "dev",
  status: "Ready",
  summary: "",
  localPath: "E:\\Dev\\Tool\\P0001",
  localVersion: "1.0.1",
  tags: [],
  usage: [],
  downloadHint: "",
  manifestPath: "tool.manifest.json",
  trackedFiles: [],
  scriptFiles: [],
  version: "1.0.1",
  releaseUrl: "https://github.com/org/repo/releases",
  repoUrl: "https://github.com/org/repo",
  downloadUrl: "https://github.com/org/repo/releases",
  healthLabel: "Ready",
  updatedAt: "2026-05-20T10:00:00Z",
  driftAlerts: [],
  suggestions: [],
  remote: {
    id: "p0001",
    loading: false,
    packageJson: { version: "1.0.1" },
    manifest: { release: { version: "1.0.0" } },
    latestRelease: { tag_name: "v1.0.1", html_url: "https://github.com/org/repo/releases/tag/v1.0.1" },
    releases: [
      { tag_name: "v1.0.1", published_at: "2026-05-20T12:00:00Z" },
      { tag_name: "v1.0.0", published_at: "2026-05-01T12:00:00Z" },
    ],
    gitTags: ["v1.0.1", "v1.0.0"],
    repoInfo: { pushed_at: "2026-05-24T08:00:00Z" },
    files: [
      {
        path: "CHANGELOG.md",
        ok: true,
        status: 200,
        size: 200,
        text: [
          "## 2026-05-20 - Release 1.0.1",
          "- Version: `1.0.1`",
          "- Commit: `abc1234`",
          "---",
          "## 2026-05-01 - Release 1.0.0",
          "- Version: `1.0.0`",
        ].join("\n"),
      },
    ],
  },
};

const manifest: ToolManifest = { release: { version: "1.0.0" } };

describe("collectVersionHistory", () => {
  it("one row per distinct version", () => {
    const rows = collectVersionHistory(baseTool, manifest);
    expect(rows.map((r) => r.version).sort()).toEqual(["1.0.0", "1.0.1"]);
  });

  it("current row has pipeline flags", () => {
    const current = collectVersionHistory(baseTool, manifest).find((r) => r.isCurrent);
    expect(current?.onPackage).toBe(true);
    expect(current?.onRelease).toBe(true);
    expect(current?.onGit).toBe(true);
    expect(current?.onPush).toBe(true);
    expect(current?.inChangelog).toBe(true);
  });

  it("older release row has release and git", () => {
    const old = collectVersionHistory(baseTool, manifest).find((r) => r.version === "1.0.0");
    expect(old?.onRelease).toBe(true);
    expect(old?.onGit).toBe(true);
    expect(old?.onPush).toBe(true);
  });
});
