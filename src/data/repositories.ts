import type { ToolRepository } from "../types";

export const defaultRepositories: ToolRepository[] = [
  {
    id: "github-tool-manager",
    code: "P0004",
    name: "GitHub Tool Manager",
    repo: "tuanhoangfx/GitHub-Tool-Manager",
    branch: "main",
    category: "Web",
    audience: "Tool maintainers",
    status: "Ready",
    summary: "Public card catalog and GitHub repository management console for published tools.",
    localPath: "E:\\Dev\\Tool\\GitHub-Tool-Manager",
    tags: ["React", "TypeScript", "Vite", "GitHub Pages"],
    usage: [
      "Install dependencies with corepack pnpm install.",
      "Run locally with corepack pnpm dev (http://127.0.0.1:5176).",
      "Production: https://infix1.io.vn after push to main.",
    ],
    downloadHint: "Use https://infix1.io.vn or clone the repository.",
    manifestPath: "tool.manifest.json",
    trackedFiles: ["tool.manifest.json", "package.json", "README.md", "CHANGELOG.md", "RELEASE.md"],
    scriptFiles: ["scripts/scan-local-workspace.cjs", "scripts/publish-github-repo.cjs"],
  },
  {
    id: "gpm-automation-console",
    code: "P0001",
    name: "GPM Automation Console",
    repo: "tuanhoangfx/GPM-Automation-Console",
    branch: "main",
    category: "Automation",
    audience: "GPM operators",
    status: "Ready",
    summary: "Desktop console for controlling GPM Login profiles, workflow runs, and browser automation from one local surface.",
    localPath: "E:\\Dev\\Tool\\GPM-Automation-Console",
    tags: ["Electron", "React", "GPM API", "Automation"],
    usage: [
      "Install dependencies with corepack pnpm install.",
      "Run locally with corepack pnpm dev.",
      "Build installer with corepack pnpm dist.",
    ],
    downloadHint: "Use the latest GitHub release asset when available.",
    manifestPath: "tool.manifest.json",
    trackedFiles: ["tool.manifest.json", "package.json", "README.md", "CHANGELOG.md", "RELEASE.md"],
    scriptFiles: ["scripts/sync-changelog.mjs", "scripts/sync-metadata-version.mjs", "scripts/bump-patch-version.mjs"],
  },
  {
    id: "yt-multistream-console",
    code: "P0002",
    name: "YT Multistream Console",
    repo: "tuanhoangfx/YT-Multistream-Console",
    branch: "main",
    category: "Streaming",
    audience: "Livestream operators",
    status: "Ready",
    summary: "Desktop console for running multi-channel YouTube livestream jobs from local files or Google Drive source links.",
    localPath: "E:\\Dev\\Tool\\YT-Multistream-Console",
    tags: ["Electron", "React", "FFmpeg", "YouTube"],
    usage: [
      "Install dependencies with corepack pnpm install.",
      "Run locally with corepack pnpm dev.",
      "Keep stream keys masked before sharing logs.",
    ],
    downloadHint: "Use release setup asset or clone the public repository.",
    manifestPath: "tool.manifest.json",
    trackedFiles: ["tool.manifest.json", "package.json", "README.md", "CHANGELOG.md", "RELEASE.md"],
    scriptFiles: ["scripts/sync-changelog.mjs", "scripts/sync-metadata-version.mjs", "scripts/smoke-test.cjs"],
  },
  {
    id: "zalo-ai-bot",
    code: "P0005",
    name: "Zalo AI Bot",
    repo: "tuanhoangfx/zalo-ai-bot",
    branch: "main",
    category: "Bot",
    audience: "Zalo group operators",
    status: "Ready",
    summary: "Zalo personal account bot with 9Router AI, multi-bot admin dashboard, and local thread history.",
    localPath: "E:\\Dev\\Tool\\zalo-ai-bot",
    tags: ["Node.js", "zca-js", "9Router", "Admin UI"],
    appUrl: "https://infix1.io.vn/p0005",
    usage: [
      "Copy config.example.json to config.json and configure 9Router.",
      "pnpm install && pnpm run login for Zalo QR login.",
      "Run admin.bat or open https://infix1.io.vn/p0005 (redirects to local admin).",
    ],
    downloadHint: "Clone https://github.com/tuanhoangfx/zalo-ai-bot — runtime data is not in the repo.",
    manifestPath: "tool.manifest.json",
    trackedFiles: ["tool.manifest.json", "package.json", "README.md", "CHANGELOG.md", "RELEASE.md"],
    scriptFiles: ["scripts/health-check.ps1", "scripts/install-autostart.ps1", "scripts/patch-admin-botlist.mjs"],
  },
];

export type RuleSource = {
  label: string;
  path: string;
  summary: string;
  previewPath?: string;
};

export const ruleSources: RuleSource[] = [
  {
    label: "Working Rules",
    path: "E:\\Dev\\Rules\\rules\\Working_Rules.md",
    previewPath: "/rules/working-rules.md",
    summary: "Caution, surgical scope, verification before closing, and concise communication.",
  },
  {
    label: "Workspace Design Standard",
    path: "E:\\Dev\\Rules\\standards\\Workspace_Design_Standard.md",
    previewPath: "/rules/workspace-design-standard.md",
    summary: "Shared design tokens, compact table header patterns, dropdown rules, typography, and spacing rhythm.",
  },
  {
    label: "Changelog Entry Template",
    path: "E:\\Dev\\Rules\\templates\\tool-docs\\CHANGELOG_ENTRY_TEMPLATE.md",
    previewPath: "/rules/changelog-entry-template.md",
    summary: "Parseable release history format with version, type, status, verification, and rollback sections.",
  },
  {
    label: "Design Base CSS",
    path: "E:\\Dev\\Tool\\GitHub-Tool-Manager\\src\\styles.css",
    previewPath: "/rules/design-base.md",
    summary: "Local inlined design baseline (no runtime dependency on shared Rules CSS files).",
  },
];
