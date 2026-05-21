export type SyncManifestStatus =
  | "in-sync"
  | "pushed"
  | "pulled"
  | "would-push"
  | "would-pull"
  | "skipped"
  | "error"
  | "github-only";

export type WorkspaceCatalogEntry = {
  id: string;
  code: string;
  name: string;
  repo: string;
  branch: string;
  remoteEnabled?: boolean;
  localVersion?: string;
  githubVersion?: string;
  githubVersionSource?: "manifest" | "package.json";
  githubVersionError?: string;
  versionDrift?: "match" | "drift";
  category: string;
  audience: string;
  status: string;
  summary: string;
  localPath: string;
  tags: string[];
  usage: string[];
  downloadHint: string;
  manifestPath: string;
  trackedFiles: string[];
  scriptFiles: string[];
  appUrl?: string;
  localUrl?: string;
  deployTarget?: string;
  workspaceRoot?: string;
  assetKind?: "project" | "n8n-workflow" | "github-only";
  sync?: {
    manifest?: SyncManifestStatus;
    detail?: string;
    at?: string;
    clone?: string;
    cloneDetail?: string;
  };
  githubMeta?: {
    html_url?: string;
    pushed_at?: string;
    updated_at?: string;
    private?: boolean;
  };
};

export type WorkspaceCatalog = {
  schemaVersion?: number;
  generatedAt: string;
  dryRun?: boolean;
  githubUser?: string;
  roots?: Array<{ id: string; label: string; path: string; kind: string }>;
  summary?: {
    total: number;
    projects: number;
    n8n: number;
    githubOnly?: number;
    pushed?: number;
    pulled?: number;
    inSync?: number;
    errors?: number;
    cloned?: number;
    cloneErrors?: number;
    versionDrift?: number;
  };
  cloneResults?: Array<{ repo: string; status: string; detail?: string; targetDir?: string }>;
  syncResults?: Array<{ id: string; status: string; detail: string }>;
  entries: WorkspaceCatalogEntry[];
};
