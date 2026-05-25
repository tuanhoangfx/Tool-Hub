import type { HealthState } from "../../hooks/useLocalHealth";
import type { FilterDef, FilterValues } from "../../components/sales-shell";
import type { ToolLinkRow } from "./tool-links";

const PING_IDS = new Set(["local", "app", "api"]);

export function linkPingUrl(link: ToolLinkRow): string | undefined {
  if (!PING_IDS.has(link.id) || !link.href) return undefined;
  return link.href;
}

export type LinkGroup = "web" | "vercel" | "supabase" | "github" | "meta";

export function linkGroup(id: string): LinkGroup {
  if (id === "local" || id === "app" || id === "api" || id === "admin" || id === "downloads") return "web";
  if (id.startsWith("vercel")) return "vercel";
  if (id.startsWith("supabase")) return "supabase";
  if (
    id.startsWith("github") ||
    id === "release" ||
    id === "download" ||
    id.startsWith("release-")
  ) {
    return "github";
  }
  return "meta";
}

export function linkKind(link: ToolLinkRow): "url" | "id" {
  if (link.href?.startsWith("http")) return "url";
  return "id";
}

export function linkStatusKey(link: ToolLinkRow, health: HealthState | "na"): string {
  if (!linkPingUrl(link)) return "na";
  return health;
}

export const LINK_FILTER_DEFS: FilterDef[] = [
  {
    key: "group",
    label: "Group",
    showAllLabel: true,
    options: [
      { value: "web", label: "Web / Local", color: "#22c55e" },
      { value: "vercel", label: "Vercel", color: "#e5e7eb" },
      { value: "supabase", label: "Supabase", color: "#34d399" },
      { value: "github", label: "GitHub", color: "#a78bfa" },
      { value: "meta", label: "Meta / IDs", color: "#94a3b8" },
    ],
  },
  {
    key: "status",
    label: "Status",
    showAllLabel: true,
    options: [
      { value: "online", label: "Online", color: "#22c55e" },
      { value: "offline", label: "Offline", color: "#f43f5e" },
      { value: "checking", label: "Checking", color: "#f59e0b" },
      { value: "unknown", label: "Unknown", color: "#64748b" },
      { value: "na", label: "Not pinged", color: "#475569" },
    ],
  },
  {
    key: "kind",
    label: "Type",
    showAllLabel: true,
    options: [
      { value: "url", label: "URL", color: "#06b6d4" },
      { value: "id", label: "ID / path", color: "#94a3b8" },
    ],
  },
];

export function matchesLinkFilters(
  link: ToolLinkRow,
  query: string,
  filters: FilterValues,
  healthState: Record<string, HealthState>,
): boolean {
  const q = query.trim().toLowerCase();
  if (q) {
    const hay = [link.label, link.value, link.id, link.href ?? ""].join(" ").toLowerCase();
    if (!hay.includes(q)) return false;
  }

  const status = linkStatusKey(link, linkPingUrl(link) ? (healthState[linkPingUrl(link)!] ?? "unknown") : "na");

  if (filters.group?.length && !filters.group.includes(linkGroup(link.id))) return false;
  if (filters.status?.length && !filters.status.includes(status)) return false;
  if (filters.kind?.length && !filters.kind.includes(linkKind(link))) return false;

  return true;
}
