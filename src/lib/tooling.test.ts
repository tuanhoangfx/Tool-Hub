import { describe, expect, it } from "vitest";
import type { ToolRemoteState, ToolRepository } from "../types";
import { createVersionAlerts, mergeRepos, normalizeVersion, resolveTool } from "./tooling";

function repo(overrides: Partial<ToolRepository> = {}): ToolRepository {
  return {
    id: "demo",
    code: "P0001",
    name: "Demo Tool",
    repo: "owner/demo",
    branch: "main",
    category: "Web",
    audience: "Public",
    status: "Ready",
    summary: "",
    localPath: "",
    tags: [],
    usage: [],
    downloadHint: "",
    manifestPath: "tool.manifest.json",
    trackedFiles: [],
    scriptFiles: [],
    ...overrides,
  };
}

function remote(overrides: Partial<ToolRemoteState> = {}): ToolRemoteState {
  return {
    id: "demo",
    loading: false,
    files: [],
    ...overrides,
  };
}

describe("normalizeVersion", () => {
  it("strips a leading v", () => {
    expect(normalizeVersion("v1.2.3")).toBe("1.2.3");
    expect(normalizeVersion("V0.1.0")).toBe("0.1.0");
  });

  it("returns empty string for undefined", () => {
    expect(normalizeVersion(undefined)).toBe("");
  });
});

describe("createVersionAlerts", () => {
  it("returns empty list when no remote state", () => {
    expect(createVersionAlerts(undefined)).toEqual([]);
  });

  it("detects drift across manifest / package / release", () => {
    const alerts = createVersionAlerts(
      remote({
        manifest: { release: { version: "0.1.0" } },
        packageJson: { version: "0.2.0" },
        latestRelease: { tag_name: "v0.1.0" },
        files: [
          {
            path: "CHANGELOG.md",
            ok: true,
            status: 200,
            size: 100,
            text: "# Changelog\n## 2026-01-01 - Drop\n- Version: `0.1.0`\n",
          },
        ],
      }),
    );

    expect(alerts.some((line) => line.startsWith("Version drift"))).toBe(true);
  });

  it("flags missing release when package version exists but no GitHub release", () => {
    const alerts = createVersionAlerts(
      remote({
        manifest: { release: { version: "0.2.0" } },
        packageJson: { version: "0.2.0" },
        files: [
          {
            path: "CHANGELOG.md",
            ok: true,
            status: 200,
            size: 50,
            text: "# Changelog\n## 2026-01-01 - Drop\n- Version: `0.2.0`\n",
          },
        ],
      }),
    );

    expect(alerts.some((line) => line.includes("Missing release"))).toBe(true);
  });

  it("flags unparseable changelog version", () => {
    const alerts = createVersionAlerts(
      remote({
        manifest: { release: { version: "0.1.0" } },
        packageJson: { version: "0.1.0" },
        latestRelease: { tag_name: "v0.1.0" },
        files: [],
      }),
    );

    expect(alerts.some((line) => line.toLowerCase().includes("changelog"))).toBe(true);
  });

  it("returns no alerts when all version sources align", () => {
    const alerts = createVersionAlerts(
      remote({
        manifest: { release: { version: "1.0.0" } },
        packageJson: { version: "1.0.0" },
        latestRelease: { tag_name: "v1.0.0" },
        files: [
          {
            path: "CHANGELOG.md",
            ok: true,
            status: 200,
            size: 50,
            text: "# Changelog\n## 2026-01-01 - Drop\n- Version: `1.0.0`\n",
          },
        ],
      }),
    );

    expect(alerts).toEqual([]);
  });
});

describe("mergeRepos", () => {
  const base = repo({ id: "a", repo: "owner/a", localPath: "C:/a", localVersion: "0.1.0" });

  it("returns defaults untouched when no local entries", () => {
    const merged = mergeRepos([base], []);
    expect(merged).toEqual([base]);
  });

  it("overrides localPath, localVersion, and URLs from local registry", () => {
    const merged = mergeRepos(
      [base],
      [
        repo({
          id: "a",
          repo: "owner/a",
          localPath: "D:/new",
          localVersion: "0.2.0",
          localUrl: "http://127.0.0.1:9999",
          appUrl: "https://example.com",
          deployTarget: "vercel",
        }),
      ],
    );
    expect(merged[0].localPath).toBe("D:/new");
    expect(merged[0].localVersion).toBe("0.2.0");
    expect(merged[0].localUrl).toBe("http://127.0.0.1:9999");
    expect(merged[0].appUrl).toBe("https://example.com");
    expect(merged[0].deployTarget).toBe("vercel");
  });

  it("falls back to default values when local registry has blanks", () => {
    const merged = mergeRepos(
      [base],
      [repo({ id: "a", repo: "owner/a", localPath: "", localVersion: "" })],
    );
    expect(merged[0].localPath).toBe("C:/a");
    expect(merged[0].localVersion).toBe("0.1.0");
  });

  it("appends a local-only repo when not present in defaults", () => {
    const local = repo({ id: "b", repo: "", localPath: "C:/b" });
    const merged = mergeRepos([base], [local]);
    expect(merged).toHaveLength(2);
    expect(merged[1].id).toBe("b");
  });
});

describe("resolveTool", () => {
  it("falls back to localVersion when no remote", () => {
    const tool = repo({ localVersion: "0.5.0" });
    const resolved = resolveTool(tool, undefined, (r) => `https://github.com/${r}`);
    expect(resolved.version).toBe("0.5.0");
    expect(resolved.repoUrl).toBe("https://github.com/owner/demo");
  });

  it("prefers manifest version over package version over release tag", () => {
    const resolved = resolveTool(
      repo(),
      remote({
        manifest: { release: { version: "1.0.0" } },
        packageJson: { version: "0.9.0" },
        latestRelease: { tag_name: "v0.8.0" },
      }),
      (r) => `https://github.com/${r}`,
    );
    expect(resolved.version).toBe("1.0.0");
  });

  it("uses health.status from manifest when present", () => {
    const resolved = resolveTool(
      repo({ status: "Needs review" }),
      remote({ manifest: { health: { status: "Ready" } } }),
      (r) => `https://github.com/${r}`,
    );
    expect(resolved.healthLabel).toBe("Ready");
  });
});
