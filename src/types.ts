export type RepoStatus = "Ready" | "Needs review" | "Experimental" | "Archived" | "Active" | "Beta";

export type ToolRepository = {
  id: string;
  code: string;
  name: string;
  repo: string;
  branch: string;
  remoteEnabled?: boolean;
  localVersion?: string;
  category: string;
  audience: string;
  status: RepoStatus;
  summary: string;
  localPath: string;
  tags: string[];
  usage: string[];
  appUrl?: string;
  localUrl?: string;
  icon?: string;
  deployTarget?: "github-pages" | "vercel" | "vps" | "github-release" | "local";
  downloadHint: string;
  manifestPath: string;
  trackedFiles: string[];
  scriptFiles: string[];
};

export type ToolManifest = {
  schemaVersion?: number;
  code?: string;
  id?: string;
  name?: string;
  status?: string;
  summary?: string;
  type?: string;
  owner?: string;
  aliases?: string[];
  stack?: string[];
  features?: string[];
  commands?: Record<string, string>;
  docs?: Record<string, string>;
  urls?: {
    app?: string;
    api?: string;
    admin?: string;
    local?: string;
    downloads?: string;
    localSetupAt?: string;
    appSetupAt?: string;
    adminSetupAt?: string;
  };
  manifestUpdatedAt?: string;
  github?: {
    repo?: string;
    branch?: string;
    manifestPath?: string;
    url?: string;
  };
  release?: {
    version?: string;
    readiness?: string[];
    latestPublished?: {
      tag?: string;
      url?: string;
      publishedAt?: string;
      asset?: {
        name?: string;
        downloadUrl?: string;
        size?: number;
        sha256?: string;
      };
    };
  };
  health?: {
    status?: string;
    note?: string;
  };
  deployTarget?: string;
  nextActions?: string[];
  vercel?: {
    project?: string;
    projectId?: string;
    productionUrl?: string;
    previewUrl?: string;
    productionBranch?: string;
    team?: string;
    notes?: string;
  };
  supabase?: {
    projectRef?: string;
    url?: string;
    dashboard?: string;
  };
};

export type PackageJson = {
  version?: string;
  description?: string;
  repository?: string | { type?: string; url?: string };
  scripts?: Record<string, string>;
};

export type GitHubRelease = {
  tag_name?: string;
  html_url?: string;
  published_at?: string;
  assets?: Array<{
    name: string;
    browser_download_url: string;
    size: number;
  }>;
};

export type GitHubRepoInfo = {
  html_url?: string;
  description?: string;
  pushed_at?: string;
  updated_at?: string;
  stargazers_count?: number;
  open_issues_count?: number;
  default_branch?: string;
  visibility?: string;
};

export type LocalRegistry = {
  generatedAt: string;
  root: string;
  repositories: ToolRepository[];
};

export type RemoteFileState = {
  path: string;
  ok: boolean;
  status: number;
  size: number;
  text?: string;
  error?: string;
};

export type ToolRemoteState = {
  id: string;
  loading: boolean;
  checkedAt?: string;
  repoInfo?: GitHubRepoInfo;
  manifest?: ToolManifest;
  packageJson?: PackageJson;
  latestRelease?: GitHubRelease;
  /** Recent GitHub releases (newest first), up to ~20. */
  releases?: GitHubRelease[];
  /** Git tag names from GitHub (`/tags`), normalized elsewhere. */
  gitTags?: string[];
  files: RemoteFileState[];
  error?: string;
};

export type ResolvedTool = ToolRepository & {
  remote?: ToolRemoteState;
  version: string;
  releaseUrl: string;
  repoUrl: string;
  downloadUrl: string;
  healthLabel: string;
  updatedAt: string;
  driftAlerts: string[];
  suggestions: string[];
};
