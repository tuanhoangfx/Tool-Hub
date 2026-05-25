import type { ResolvedTool, ToolManifest } from "../../types";

export type ToolLinkRow = {
  id: string;
  label: string;
  value: string;
  href?: string;
};

function add(rows: ToolLinkRow[], seen: Set<string>, row: ToolLinkRow | null) {
  if (!row?.value?.trim()) return;
  const key = `${row.id}::${row.value.trim()}`;
  if (seen.has(key)) return;
  seen.add(key);
  rows.push(row);
}

function urlRow(id: string, label: string, url?: string): ToolLinkRow | null {
  const v = url?.trim();
  if (!v) return null;
  const href = v.startsWith("http") ? v : v.startsWith("//") ? `https:${v}` : undefined;
  return { id, label, value: v, href: href ?? (v.includes(".") ? `https://${v}` : undefined) };
}

function idRow(id: string, label: string, value?: string, href?: string): ToolLinkRow | null {
  const v = value?.trim();
  if (!v) return null;
  return { id, label, value: v, href: href?.trim() || undefined };
}

/** Gom mọi URL/ID quan trọng từ manifest + registry để kiểm soát nhanh. */
export function collectImportantLinks(tool: ResolvedTool, manifest: ToolManifest): ToolLinkRow[] {
  const rows: ToolLinkRow[] = [];
  const seen = new Set<string>();
  const urls = manifest.urls ?? {};
  const vercel = manifest.vercel;
  const supabase = manifest.supabase;
  const gh = manifest.github;

  add(rows, seen, urlRow("local", "Local dev", urls.local ?? tool.localUrl));
  add(rows, seen, urlRow("app", "Web / Production", urls.app ?? tool.appUrl));
  add(rows, seen, urlRow("api", "API", urls.api));
  add(rows, seen, urlRow("admin", "Admin", urls.admin));
  add(rows, seen, urlRow("downloads", "Downloads", urls.downloads));

  add(rows, seen, urlRow("vercel-production", "Vercel production", vercel?.productionUrl));
  add(rows, seen, urlRow("vercel-preview", "Vercel preview", vercel?.previewUrl));

  if (vercel?.projectId) {
    const dash = vercel.team && vercel.project
      ? `https://vercel.com/${vercel.team}/${vercel.project}`
      : `https://vercel.com/dashboard`;
    add(
      rows,
      seen,
      idRow("vercel-project-id", "Vercel project ID", vercel.projectId, dash),
    );
  }
  add(rows, seen, idRow("vercel-project", "Vercel project", vercel?.project, vercel?.team && vercel?.project
    ? `https://vercel.com/${vercel.team}/${vercel.project}`
    : undefined));

  add(rows, seen, idRow("vercel-team", "Vercel team", vercel?.team));

  add(rows, seen, urlRow("supabase-api", "Supabase URL", supabase?.url));
  add(rows, seen, urlRow("supabase-dashboard", "Supabase dashboard", supabase?.dashboard));
  add(rows, seen, idRow("supabase-ref", "Supabase project ref", supabase?.projectRef, supabase?.dashboard));

  const repoSlug = gh?.repo ?? tool.repo;
  if (repoSlug) {
    add(rows, seen, urlRow("github", "GitHub repo", gh?.url ?? `https://github.com/${repoSlug}`));
    add(
      rows,
      seen,
      idRow("github-branch", "GitHub branch", gh?.branch ?? tool.branch, `https://github.com/${repoSlug}/tree/${gh?.branch ?? tool.branch}`),
    );
  }

  add(rows, seen, urlRow("release", "GitHub release", tool.releaseUrl));
  add(rows, seen, urlRow("download", "Release download", tool.downloadUrl));
  const published = manifest.release?.latestPublished;
  if (published?.url) add(rows, seen, urlRow("release-latest", "Latest published", published.url));
  if (published?.asset?.downloadUrl) {
    add(rows, seen, urlRow("release-asset", "Release asset", published.asset.downloadUrl));
  }

  if (manifest.deployTarget ?? tool.deployTarget) {
    add(rows, seen, idRow("deploy-target", "Deploy target", manifest.deployTarget ?? tool.deployTarget));
  }

  if (tool.localPath) {
    add(rows, seen, idRow("local-path", "Local folder", tool.localPath));
  }

  add(rows, seen, idRow("tool-code", "Tool code", tool.code));
  add(rows, seen, idRow("tool-id", "Registry id", tool.id));

  if (manifest.docs?.readme && manifest.docs.readme !== "#") {
    const readmeHref = repoSlug
      ? `https://github.com/${repoSlug}/blob/${gh?.branch ?? tool.branch}/${manifest.docs.readme}`
      : undefined;
    add(rows, seen, idRow("readme", "README path", manifest.docs.readme, readmeHref));
  }

  return rows;
}
