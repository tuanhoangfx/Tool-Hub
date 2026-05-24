import type { ToolRepository } from "../types";
import { parseRegistry } from "./registry-schema";

// Minimal fallback so the app stays usable if /registry.default.json
// cannot be fetched (offline, 404, JSON parse error). Acts as the seed
// before the runtime catalog finishes loading.
export const FALLBACK_REPOSITORIES: ToolRepository[] = [
  {
    id: "tool-hub",
    code: "P0004",
    name: "Tool Hub",
    repo: "tuanhoangfx/Tool-Hub",
    branch: "main",
    category: "Web",
    audience: "Tool maintainers",
    status: "Ready",
    summary: "Library catalog for the workspace: accurate GitHub info, usage links, local paths, and versions of every running project.",
    localPath: "E:\\Dev\\Tool\\P0004-Tool-Hub",
    tags: ["React", "TypeScript", "Vite", "GitHub Pages"],
    appUrl: "https://infix1.io.vn",
    localUrl: "http://127.0.0.1:5176",
    deployTarget: "github-pages",
    usage: [
      "Local: corepack pnpm dev (http://127.0.0.1:5176)",
      "Build: corepack pnpm build",
      "Production deploys via GitHub Actions on push to main",
    ],
    downloadHint: "Use https://infix1.io.vn or clone the repository.",
    manifestPath: "tool.manifest.json",
    trackedFiles: ["tool.manifest.json", "package.json", "README.md", "CHANGELOG.md", "RELEASE.md"],
    scriptFiles: ["scripts/scan-local-workspace.cjs", "scripts/publish-github-repo.cjs"],
  },
];

const REGISTRY_URL = "/registry.default.json";

export async function loadDefaultRepositories(): Promise<ToolRepository[]> {
  try {
    const response = await fetch(`${REGISTRY_URL}?t=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const raw = (await response.json()) as unknown;
    const parsed = parseRegistry(raw);
    if (!parsed.ok) throw new Error(`schema invalid: ${parsed.error}`);
    return parsed.data;
  } catch (error) {
    console.warn("[registry] falling back to bundled defaults:", error);
    return FALLBACK_REPOSITORIES;
  }
}
