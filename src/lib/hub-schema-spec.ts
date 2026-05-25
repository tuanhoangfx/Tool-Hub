export type HubEntity = "catalog" | "manifest" | "runtime";

export type Mode = "input" | "auto" | "derive" | "compute" | "ro";

export type FieldSpec = {
  key: string;
  icon: string;
  label: string;
  col: string;
  type: string;
  mode: Mode;
  group: string;
  groupIcon: string;
  default?: string;
  source?: string;
  options?: string[];
  pk?: boolean;
};

export type GroupTone = { bar: string; border: string; bg: string; text: string };

function f(
  key: string,
  label: string,
  group: string,
  opts: Partial<FieldSpec> = {},
): FieldSpec {
  return {
    key,
    icon: opts.icon ?? "·",
    label,
    col: opts.col ?? key,
    type: opts.type ?? "text",
    mode: opts.mode ?? "input",
    group,
    groupIcon: opts.groupIcon ?? "📦",
    default: opts.default,
    source: opts.source,
    options: opts.options,
    pk: opts.pk,
  };
}

export const CATALOG_SPEC: FieldSpec[] = [
  f("id", "Tool ID", "Identity", { icon: "🆔", pk: true, mode: "ro", source: "registry.json unique key" }),
  f("code", "Project code", "Identity", { icon: "🏷️", mode: "input", source: "P00xx folder code" }),
  f("name", "Display name", "Identity", { icon: "📛", mode: "input" }),
  f("repo", "GitHub repo", "Repository", { icon: "🐙", mode: "input", source: "owner/name" }),
  f("branch", "Default branch", "Repository", { icon: "🌿", mode: "input", default: "main" }),
  f("remoteEnabled", "Remote enabled", "Repository", { icon: "☁️", type: "bool", mode: "auto" }),
  f("localVersion", "Local version", "Repository", { icon: "🔢", mode: "derive", source: "package.json / manifest" }),
  f("category", "Category", "Classification", { icon: "📂", mode: "input" }),
  f("audience", "Audience", "Classification", { icon: "👥", mode: "input" }),
  f("status", "Status", "Classification", {
    icon: "●",
    mode: "input",
    options: ["Ready", "Needs review", "Experimental", "Archived", "Active", "Beta"],
  }),
  f("summary", "Summary", "Classification", { icon: "📝", type: "text", mode: "input" }),
  f("tags", "Tags", "Classification", { icon: "🏷️", mode: "input", source: "string[]" }),
  f("localPath", "Local path", "Paths", { icon: "📁", mode: "input" }),
  f("manifestPath", "Manifest path", "Paths", { icon: "📄", mode: "ro", default: "tool.manifest.json" }),
  f("deployTarget", "Deploy target", "Deploy", {
    icon: "🚀",
    mode: "input",
    options: ["github-pages", "vercel", "vps", "github-release", "local"],
  }),
  f("appUrl", "Production URL", "Deploy", { icon: "🌐", mode: "input" }),
  f("localUrl", "Local dev URL", "Deploy", { icon: "💻", mode: "input" }),
  f("downloadHint", "Download hint", "Deploy", { icon: "⬇️", mode: "ro" }),
  f("trackedFiles", "Tracked files", "Metadata", { icon: "📋", mode: "ro", source: "manifest sync list" }),
  f("scriptFiles", "Script files", "Metadata", { icon: "⚙️", mode: "ro" }),
  f("usage", "Usage bullets", "Metadata", { icon: "💡", mode: "input", source: "string[]" }),
];

export const MANIFEST_SPEC: FieldSpec[] = [
  f("schemaVersion", "Schema version", "Metadata", { icon: "🔢", type: "int", mode: "ro" }),
  f("code", "Code", "Identity", { icon: "🏷️", pk: true }),
  f("name", "Name", "Identity", { icon: "📛" }),
  f("type", "Type", "Identity", { icon: "🖥️", options: ["Web", "Electron", "Node", "Static", "Infra"] }),
  f("owner", "Owner", "Identity", { icon: "👤" }),
  f("status", "Status", "Identity", { icon: "●" }),
  f("summary", "Summary", "Identity", { icon: "📝" }),
  f("stack", "Stack", "Release", { icon: "🧱", mode: "input", source: "string[]" }),
  f("release.version", "Release version", "Release", { icon: "🏷️", col: "release.version", mode: "input" }),
  f("release.readiness", "Readiness gates", "Release", { icon: "✅", mode: "ro", source: "string[]" }),
  f("urls.app", "App URL", "URLs", { icon: "🌐", col: "urls.app" }),
  f("urls.local", "Local URL", "URLs", { icon: "💻", col: "urls.local" }),
  f("github.repo", "GitHub repo", "GitHub", { icon: "🐙", col: "github.repo" }),
  f("github.branch", "Branch", "GitHub", { icon: "🌿", col: "github.branch" }),
  f("health.status", "Health status", "Health", { icon: "💚", col: "health.status" }),
  f("health.note", "Health note", "Health", { icon: "📋", col: "health.note" }),
  f("docs.readme", "README path", "Docs", { icon: "📖", col: "docs.readme", mode: "ro" }),
  f("docs.changelog", "Changelog path", "Docs", { icon: "🕐", col: "docs.changelog", mode: "ro" }),
];

export const RUNTIME_SPEC: FieldSpec[] = [
  f("healthLabel", "Health label", "Runtime", { icon: "💚", mode: "derive", source: "GitHub + drift rules" }),
  f("driftAlerts", "Drift alerts", "Runtime", { icon: "⚠️", mode: "compute", source: "version / manifest compare" }),
  f("remote.latestRelease", "Latest release", "GitHub API", { icon: "🏷️", col: "remote.latestRelease", mode: "auto" }),
  f("remote.files", "Tracked file health", "GitHub API", { icon: "📂", mode: "auto" }),
  f("remote.checkedAt", "Last checked", "GitHub API", { icon: "🕐", type: "tstz", mode: "auto" }),
  f("version", "Resolved version", "Sync", { icon: "🔢", mode: "derive" }),
  f("releaseUrl", "Release URL", "Sync", { icon: "🔗", mode: "derive" }),
  f("repoUrl", "Repo URL", "Sync", { icon: "🐙", mode: "derive" }),
];

export const CATALOG_GROUPS = ["Identity", "Repository", "Classification", "Paths", "Deploy", "Metadata"] as const;
export const MANIFEST_GROUPS = ["Metadata", "Identity", "Release", "URLs", "GitHub", "Health", "Docs"] as const;
export const RUNTIME_GROUPS = ["Runtime", "GitHub API", "Sync"] as const;

export const HUB_REGISTRY = {
  catalog: { fields: CATALOG_SPEC, groups: CATALOG_GROUPS },
  manifest: { fields: MANIFEST_SPEC, groups: MANIFEST_GROUPS },
  runtime: { fields: RUNTIME_SPEC, groups: RUNTIME_GROUPS },
} as const;

export function specForEntity(entity: HubEntity): FieldSpec[] {
  return HUB_REGISTRY[entity].fields;
}

export function groupsForEntity(entity: HubEntity): readonly string[] {
  return HUB_REGISTRY[entity].groups;
}

export const GROUP_TONE: Record<string, GroupTone> = {
  Metadata: { bar: "bg-slate-500", border: "border-slate-500/40", bg: "bg-slate-500/[.04]", text: "text-slate-300" },
  Identity: { bar: "bg-yellow-500", border: "border-yellow-500/40", bg: "bg-yellow-500/[.04]", text: "text-yellow-300" },
  Repository: { bar: "bg-indigo-500", border: "border-indigo-500/40", bg: "bg-indigo-500/[.04]", text: "text-indigo-300" },
  Classification: { bar: "bg-emerald-500", border: "border-emerald-500/40", bg: "bg-emerald-500/[.04]", text: "text-emerald-300" },
  Paths: { bar: "bg-cyan-500", border: "border-cyan-500/40", bg: "bg-cyan-500/[.04]", text: "text-cyan-300" },
  Deploy: { bar: "bg-orange-500", border: "border-orange-500/40", bg: "bg-orange-500/[.04]", text: "text-orange-300" },
  Release: { bar: "bg-amber-500", border: "border-amber-500/40", bg: "bg-amber-500/[.04]", text: "text-amber-300" },
  URLs: { bar: "bg-blue-500", border: "border-blue-500/40", bg: "bg-blue-500/[.04]", text: "text-blue-300" },
  GitHub: { bar: "bg-fuchsia-500", border: "border-fuchsia-500/40", bg: "bg-fuchsia-500/[.04]", text: "text-fuchsia-300" },
  Health: { bar: "bg-emerald-500", border: "border-emerald-500/40", bg: "bg-emerald-500/[.04]", text: "text-emerald-300" },
  Docs: { bar: "bg-purple-500", border: "border-purple-500/40", bg: "bg-purple-500/[.04]", text: "text-purple-300" },
  Runtime: { bar: "bg-rose-500", border: "border-rose-500/40", bg: "bg-rose-500/[.04]", text: "text-rose-300" },
  "GitHub API": { bar: "bg-teal-500", border: "border-teal-500/40", bg: "bg-teal-500/[.04]", text: "text-teal-300" },
  Sync: { bar: "bg-violet-500", border: "border-violet-500/40", bg: "bg-violet-500/[.04]", text: "text-violet-300" },
};

export const MODE_TONE: Record<Mode, string> = {
  input: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  auto: "bg-purple-500/15 text-purple-300 border-purple-500/30",
  derive: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  compute: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
  ro: "bg-slate-500/15 text-slate-300 border-slate-500/30",
};

export const TYPE_TONE: Record<string, string> = {
  text: "text-blue-300",
  int: "text-fuchsia-300",
  numeric: "text-fuchsia-300",
  date: "text-orange-300",
  tstz: "text-orange-300",
  bool: "text-yellow-300",
};

export function slug(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
