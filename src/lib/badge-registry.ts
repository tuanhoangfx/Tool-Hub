/**
 * Single source of truth for MetricBadge label + icon + tone.
 * Hub deploy/health/category chips are canonical; System (Tool Links, Schema) must delegate here.
 */
import type { ElementType } from "react";
import {
  Activity,
  AlertTriangle,
  Archive,
  Beaker,
  BookOpen,
  Bot,
  Calculator,
  CheckCircle2,
  Cloud,
  Database,
  FileCode2,
  FileText,
  Flag,
  FlaskConical,
  FolderOpen,
  Fingerprint,
  Github,
  HardDrive,
  Heart,
  Layers,
  Link2,
  Lock,
  Monitor,
  Package,
  Pencil,
  Puzzle,
  RefreshCw,
  Rocket,
  Server,
  Shield,
  ShieldCheck,
  Star,
  LayoutTemplate,
  Tag,
  Terminal,
  Wrench,
  Zap,
  Ellipsis,
  Crown,
  UserRound,
  Users,
  X,
  BriefcaseBusiness,
  Clock,
  CircleOff,
  Building2,
  Globe2,
  CreditCard,
  History,
  Upload,
  Download,
  GitBranch,
} from "lucide-react";
import type { FilterOption } from "../components/sales-shell/FilterBar";
import type { LinkGroup } from "../features/overview/tool-link-filters";
import type { Mode } from "./hub-schema-spec";
import { deployLabel } from "./tooling";
import type { MetricBadgeTone } from "../components/sales-shell/MetricBadge";
import {
  AGENT_KIND_SEMANTIC,
  AGENT_SCOPE_SEMANTIC,
  HUB_APP_TAB_GROUP_META,
  HUB_UI_TEMPLATE_META,
  navBadgeIconClass,
  resolveHubAppTabGroupBadge,
  resolveHubUiTemplateBadge,
  semanticFilterMeta,
} from "@tool-workspace/hub-ui";

export type FilterIconMeta = {
  icon: ElementType<{ size?: number; className?: string }>;
  className: string;
};

export type BadgeSpec = {
  label: string;
  iconMeta: FilterIconMeta;
  tone?: MetricBadgeTone;
  variantClass?: string;
};

function pick(map: Record<string, FilterIconMeta>, key: string): FilterIconMeta | null {
  return map[key] ?? null;
}

/** Hub — health / status filters & cards */
export const CHART_OTHERS_LABEL = "Others";

/** Rolled-up chart bucket + KPI/chart parity for Draft. */
export const CHART_LEGEND_EXTRA: Record<string, FilterIconMeta> = {
  [CHART_OTHERS_LABEL]: { icon: Ellipsis, className: "text-slate-400" },
  Other: { icon: Ellipsis, className: "text-slate-400" },
  Draft: { icon: Pencil, className: "text-amber-300" },
};

export const STATUS_HEALTH: Record<string, FilterIconMeta> = {
  Ready: { icon: CheckCircle2, className: "text-emerald-400" },
  "Needs review": { icon: Flag, className: "text-purple-400" },
  Draft: CHART_LEGEND_EXTRA.Draft,
  Active: { icon: Zap, className: "text-sky-400" },
  Beta: { icon: Beaker, className: "text-amber-400" },
  Experimental: { icon: FlaskConical, className: "text-amber-400" },
  Archived: { icon: Archive, className: "text-slate-400" },
};

/** Hub — category filter & ToolCodeBadge */
export const CATEGORY: Record<string, FilterIconMeta> = {
  Web: { icon: Monitor, className: "text-indigo-400" },
  Desktop: { icon: Monitor, className: "text-violet-400" },
  Local: { icon: HardDrive, className: "text-purple-400" },
  Bot: { icon: Bot, className: "text-cyan-400" },
  Extension: { icon: Puzzle, className: "text-fuchsia-300" },
  Infrastructure: { icon: Server, className: "text-slate-300" },
  "App Script": { icon: FileCode2, className: "text-amber-300" },
  GUI: { icon: Layers, className: "text-indigo-300" },
};

/** Hub — deploy filter & deploy QuietChip (canonical "Vercel", etc.) */
export const DEPLOY: Record<string, FilterIconMeta> = {
  Vercel: { icon: Cloud, className: "text-sky-300" },
  "GitHub Release": { icon: Package, className: "text-emerald-300" },
  "GitHub Pages": { icon: Github, className: "text-violet-300" },
  "VPS · CloudFly": { icon: Server, className: "text-orange-300" },
  "Local only": { icon: HardDrive, className: "text-slate-400" },
};

const DRIFT: Record<string, FilterIconMeta> = {
  drift: { icon: AlertTriangle, className: "text-rose-400" },
  clean: { icon: ShieldCheck, className: "text-emerald-400" },
};

const LINKS: Record<string, FilterIconMeta> = {
  missing: { icon: Link2, className: "text-amber-400" },
};

/** Hub Users — workspace roles (same icons as HubRoleBadge). */
export const WORKSPACE_ROLE: Record<string, FilterIconMeta> = {
  admin: { icon: Crown, className: "text-indigo-300" },
  manager: { icon: ShieldCheck, className: "text-purple-300" },
  user: { icon: UserRound, className: "text-emerald-300" },
  employee: { icon: UserRound, className: "text-emerald-300" },
};

/** Users tab — presence / activity filter (key `status`, label Activity). */
const USER_ACTIVITY: Record<string, FilterIconMeta> = {
  online: { icon: CheckCircle2, className: "text-emerald-400" },
  active: { icon: Zap, className: "text-cyan-400" },
  idle: { icon: Clock, className: "text-amber-400" },
  offline: { icon: CircleOff, className: "text-slate-400" },
};

const VERSION_SYNC: Record<string, FilterIconMeta> = {
  current: { icon: Tag, className: "text-indigo-300" },
  synced: { icon: CheckCircle2, className: "text-emerald-400" },
  "needs-push": { icon: Upload, className: "text-amber-300" },
  "needs-sync": { icon: Download, className: "text-rose-300" },
  history: { icon: History, className: "text-slate-400" },
};

const QUOTA_HEALTH: Record<string, FilterIconMeta> = {
  ok: { icon: CheckCircle2, className: "text-emerald-400" },
  restricted: { icon: Lock, className: "text-amber-400" },
  unhealthy: { icon: AlertTriangle, className: "text-rose-400" },
  error: { icon: AlertTriangle, className: "text-rose-400" },
};

const FILTER_ALL: Record<string, FilterIconMeta> = {
  health: { icon: Activity, className: "text-emerald-400" },
  category: { icon: Layers, className: "text-indigo-400" },
  deploy: { icon: Rocket, className: "text-sky-400" },
  status: { icon: Activity, className: "text-cyan-400" },
  role: { icon: Users, className: "text-indigo-300" },
  project: { icon: BriefcaseBusiness, className: "text-emerald-400" },
  drift: { icon: AlertTriangle, className: "text-rose-400" },
  links: { icon: Link2, className: "text-amber-400" },
  sync: { icon: GitBranch, className: "text-indigo-300" },
  org: { icon: Building2, className: "text-violet-300" },
  region: { icon: Globe2, className: "text-sky-300" },
  plan: { icon: CreditCard, className: "text-amber-300" },
  tool: { icon: Package, className: "text-indigo-300" },
  entity: { icon: Database, className: "text-indigo-300" },
  group: {
    icon: HUB_APP_TAB_GROUP_META.hub.icon,
    className: navBadgeIconClass(HUB_APP_TAB_GROUP_META.hub.iconTone),
  },
  template: {
    icon: HUB_UI_TEMPLATE_META.directory.icon,
    className: navBadgeIconClass(HUB_UI_TEMPLATE_META.directory.iconTone),
  },
  kind: { icon: Link2, className: "text-cyan-300" },
  agentKind: { icon: Shield, className: "text-emerald-300" },
  agentScope: { icon: FolderOpen, className: "text-cyan-300" },
  grant: { icon: CheckCircle2, className: "text-emerald-400" },
};

const LINK_STATUS: Record<string, FilterIconMeta> = {
  online: { icon: CheckCircle2, className: "text-emerald-400" },
  offline: { icon: AlertTriangle, className: "text-rose-400" },
  checking: { icon: Activity, className: "text-amber-400" },
  unknown: { icon: Activity, className: "text-slate-400" },
  na: { icon: HardDrive, className: "text-slate-500" },
};

const LINK_STATUS_LABEL: Record<string, string> = {
  online: "Online",
  offline: "Offline",
  checking: "Checking",
  unknown: "Unknown",
  na: "Not pinged",
};

const LINK_STATUS_TONE: Record<string, MetricBadgeTone> = {
  online: "ok",
  offline: "bad",
  checking: "warn",
  unknown: "neutral",
  na: "neutral",
};

const LINK_KIND: Record<string, FilterIconMeta> = {
  url: { icon: Link2, className: "text-cyan-400" },
  id: { icon: Tag, className: "text-slate-400" },
};

const LINK_KIND_LABEL: Record<string, string> = {
  url: "URL",
  id: "ID / path",
};

export const SCHEMA_GROUP: Record<string, FilterIconMeta> = {
  Metadata: { icon: Database, className: "text-slate-300" },
  Identity: { icon: Fingerprint, className: "text-yellow-300" },
  Repository: { icon: Github, className: "text-indigo-300" },
  Classification: { icon: Layers, className: "text-emerald-300" },
  Paths: { icon: FolderOpen, className: "text-cyan-300" },
  Deploy: { icon: Rocket, className: "text-orange-300" },
  Release: { icon: Package, className: "text-amber-300" },
  URLs: { icon: Link2, className: "text-blue-300" },
  GitHub: { icon: Github, className: "text-fuchsia-300" },
  Health: { icon: Heart, className: "text-emerald-300" },
  Docs: { icon: FileText, className: "text-purple-300" },
  Runtime: { icon: Server, className: "text-rose-300" },
  "GitHub API": { icon: Github, className: "text-teal-300" },
  Sync: { icon: RefreshCw, className: "text-violet-300" },
};

export const SCHEMA_MODE: Record<Mode, FilterIconMeta> = {
  input: { icon: Pencil, className: "text-emerald-300" },
  auto: { icon: Bot, className: "text-purple-300" },
  derive: { icon: RefreshCw, className: "text-amber-300" },
  compute: { icon: Calculator, className: "text-cyan-300" },
  ro: { icon: Lock, className: "text-slate-300" },
};

/** Agent context tab — kind / scope chips (Schema-style tones). */
export const AGENT_KIND_META: Record<string, FilterIconMeta> = Object.fromEntries(
  Object.entries(AGENT_KIND_SEMANTIC).map(([kind, key]) => [kind, semanticFilterMeta(key)]),
);

export const AGENT_KIND_LABEL: Record<string, string> = {
  pattern: "Pattern",
  rule: "Rule",
  skill: "Skill",
  command: "Command",
  doc: "Doc",
  agent: "Subagent",
};

export const AGENT_KIND_TONE: Record<string, string> = {
  pattern: "border-violet-500/40 bg-violet-500/[.04] text-violet-300",
  rule: "border-emerald-500/40 bg-emerald-500/[.04] text-emerald-300",
  skill: "border-purple-500/40 bg-purple-500/[.04] text-purple-300",
  command: "border-cyan-500/40 bg-cyan-500/[.04] text-cyan-300",
  doc: "border-amber-500/40 bg-amber-500/[.04] text-amber-300",
  agent: "border-indigo-500/40 bg-indigo-500/[.04] text-indigo-300",
};

export const AGENT_SCOPE_META: Record<string, FilterIconMeta> = Object.fromEntries(
  Object.entries(AGENT_SCOPE_SEMANTIC).map(([scope, key]) => [scope, semanticFilterMeta(key)]),
);

export const AGENT_SCOPE_LABEL: Record<string, string> = {
  workspace: "Workspace",
  user: "User",
  package: "Package",
};

export const AGENT_SCOPE_TONE: Record<string, string> = {
  workspace: "border-cyan-500/35 bg-cyan-500/[.06] text-cyan-200",
  user: "border-emerald-500/35 bg-emerald-500/[.06] text-emerald-200",
  package: "border-indigo-500/35 bg-indigo-500/[.06] text-indigo-200",
};

export function resolveAgentKindBadge(kind: string): BadgeSpec {
  const label = AGENT_KIND_LABEL[kind] ?? kind;
  const iconMeta = AGENT_KIND_META[kind] ?? AGENT_KIND_META.rule;
  const variantClass = AGENT_KIND_TONE[kind] ?? AGENT_KIND_TONE.rule;
  return { label, iconMeta, variantClass };
}

export function resolveAgentScopeBadge(scope: string): BadgeSpec {
  const label = AGENT_SCOPE_LABEL[scope] ?? scope;
  const iconMeta = AGENT_SCOPE_META[scope] ?? AGENT_SCOPE_META.workspace;
  const variantClass = AGENT_SCOPE_TONE[scope] ?? AGENT_SCOPE_TONE.workspace;
  return { label, iconMeta, variantClass };
}

export const MODE_LABEL_SHORT: Record<Mode, string> = {
  input: "Input",
  auto: "Auto",
  derive: "Derive",
  compute: "Compute",
  ro: "Read-only",
};

const FIELD_KEY: Record<string, FilterIconMeta> = {
  id: { icon: Fingerprint, className: "text-yellow-300" },
  code: { icon: Tag, className: "text-indigo-300" },
  name: { icon: FileText, className: "text-slate-200" },
  repo: { icon: Github, className: "text-violet-300" },
  branch: { icon: RefreshCw, className: "text-emerald-300" },
  category: { icon: Layers, className: "text-emerald-300" },
  status: { icon: Flag, className: "text-violet-300" },
  deployTarget: { icon: Rocket, className: "text-orange-300" },
  healthLabel: { icon: Heart, className: "text-emerald-300" },
  driftAlerts: { icon: AlertTriangle, className: "text-rose-300" },
};

const HUB_KPI: Record<string, FilterIconMeta> = {
  total: { icon: Package, className: "text-indigo-300" },
  ready: { icon: CheckCircle2, className: "text-emerald-300" },
  releases: { icon: Rocket, className: "text-amber-300" },
  drift: { icon: AlertTriangle, className: "text-rose-300" },
  local_only: { icon: Monitor, className: "text-slate-300" },
  link_gaps: { icon: Link2, className: "text-rose-300" },
  draft: { icon: Pencil, className: "text-amber-300" },
  hosted: { icon: Server, className: "text-sky-300" },
};

const LINK_GROUP_LABEL: Record<LinkGroup, string> = {
  web: "Web / Local",
  vercel: "Vercel",
  supabase: "Supabase",
  github: "GitHub",
  meta: "Meta / IDs",
};

function linkGroupFilterLabel(group: LinkGroup): string {
  return LINK_GROUP_LABEL[group] ?? group;
}

export function resolveFilterAllIcon(filterKey: string): FilterIconMeta | null {
  return FILTER_ALL[filterKey] ?? null;
}

export function resolveFilterOptionIcon(filterKey: string, option: FilterOption): FilterIconMeta | null {
  switch (filterKey) {
    case "agentKind":
      return AGENT_KIND_META[option.value] ?? { icon: Tag, className: "text-slate-400" };
    case "agentScope":
      return AGENT_SCOPE_META[option.value] ?? { icon: FolderOpen, className: "text-slate-400" };
    case "role":
      return pick(WORKSPACE_ROLE, option.value) ?? pick(WORKSPACE_ROLE, option.label.toLowerCase());
    case "tool":
      if (option.value === "__no_tools__" || option.label === "No tool access") {
        return { icon: FolderOpen, className: "text-slate-400" };
      }
      return resolveCategoryDisplayIcon(option.label) ?? { icon: Package, className: "text-indigo-300" };
    case "project":
      if (option.value === "__none__" || option.label === "No project") {
        return { icon: FolderOpen, className: "text-slate-400" };
      }
      return { icon: BriefcaseBusiness, className: "text-emerald-400" };
    case "health":
      return (
        pick(QUOTA_HEALTH, option.value) ??
        pick(STATUS_HEALTH, option.label) ??
        pick(STATUS_HEALTH, option.value) ??
        null
      );
    case "status":
      return (
        pick(USER_ACTIVITY, option.value) ??
        pick(STATUS_HEALTH, option.label) ??
        pick(STATUS_HEALTH, option.value) ??
        LINK_STATUS[option.value] ??
        null
      );
    case "category":
      return pick(CATEGORY, option.label) ?? { icon: SCHEMA_GROUP.Classification.icon, className: "text-indigo-300/90" };
    case "deploy":
      return pick(DEPLOY, option.label) ?? { icon: DEPLOY.Vercel.icon, className: "text-sky-300/90" };
    case "drift":
      return pick(DRIFT, option.value);
    case "links":
      return pick(LINKS, option.value);
    case "sync":
      return pick(VERSION_SYNC, option.value);
    case "org":
      return { icon: Building2, className: "text-violet-300" };
    case "region":
      return { icon: Globe2, className: "text-sky-300" };
    case "plan":
      return { icon: CreditCard, className: "text-amber-300" };
    case "group":
      if (option.value === "hub" || option.value === "users" || option.value === "system") {
        return resolveHubAppTabGroupBadge(option.value).iconMeta;
      }
      return resolveLinkGroupBadge(option.value as LinkGroup).iconMeta;
    case "template":
      return resolveHubUiTemplateBadge(option.value).iconMeta;
    case "pinned":
      return option.value === "pinned"
        ? { icon: Star, className: navBadgeIconClass("amber") }
        : null;
    case "kind":
      return resolveLinkKindBadge(option.value).iconMeta;
    case "grant":
      return option.value === "granted"
        ? { icon: CheckCircle2, className: "text-emerald-400" }
        : { icon: X, className: "text-slate-400" };
    case "entity":
      return { icon: Database, className: "text-indigo-300" };
    default:
      return null;
  }
}

export function resolveHealthStatusIcon(label?: string | null): FilterIconMeta | null {
  if (!label) return null;
  return pick(STATUS_HEALTH, label);
}

export function resolveDeployTargetIcon(target?: string): FilterIconMeta {
  return resolveDeployBadge(target).iconMeta;
}

export function resolveCategoryDisplayIcon(category?: string): FilterIconMeta {
  if (!category) return { icon: CATEGORY.Web.icon, className: "text-indigo-300/90" };
  return pick(CATEGORY, category) ?? { icon: CATEGORY.Web.icon, className: "text-indigo-300/90" };
}

export function resolveDriftChipIcon(): FilterIconMeta {
  return DRIFT.drift;
}

export function resolveDriftCleanIcon(): FilterIconMeta {
  return DRIFT.clean;
}

export function resolveLinkGapChipIcon(): FilterIconMeta {
  return LINKS.missing;
}

export function resolveLocalOnlyIcon(): FilterIconMeta {
  return DEPLOY["Local only"];
}

export function resolveLocalPortIcon(online: boolean): FilterIconMeta {
  return online
    ? { icon: STATUS_HEALTH.Ready.icon, className: "text-emerald-400" }
    : DEPLOY["Local only"];
}

export function resolveSchemaGroupIcon(group: string): FilterIconMeta {
  return SCHEMA_GROUP[group] ?? { icon: SCHEMA_GROUP.Classification.icon, className: "text-slate-300" };
}

export function resolveSchemaModeIcon(mode: Mode): FilterIconMeta {
  return SCHEMA_MODE[mode];
}

export function resolveFieldSpecIcon(field: { key: string }): FilterIconMeta {
  return FIELD_KEY[field.key] ?? { icon: SCHEMA_GROUP.Metadata.icon, className: "text-slate-400" };
}

export function resolveHubKpiIcon(key: string): FilterIconMeta | null {
  return HUB_KPI[key] ?? null;
}

export function resolveChartLegendIcon(label: string): FilterIconMeta | null {
  const key = label.trim();
  if (!key || key === "—") return null;
  if (key === CHART_OTHERS_LABEL || key === "Other") return CHART_LEGEND_EXTRA[CHART_OTHERS_LABEL];

  for (const [kind, display] of Object.entries(AGENT_KIND_LABEL)) {
    if (display === key) return AGENT_KIND_META[kind] ?? null;
  }
  const scopeHit = pick(AGENT_SCOPE_META, key.toLowerCase());
  if (scopeHit) return scopeHit;

  if (key === "Always apply") return semanticFilterMeta("agent.alwaysApply");
  if (key === "Agent requestable") return semanticFilterMeta("agent.requestable");
  if (key.startsWith("Manual")) return { icon: Wrench, className: "text-slate-400" };

  for (const mode of Object.keys(SCHEMA_MODE) as Mode[]) {
    if (MODE_LABEL_SHORT[mode] === key || mode === key) return SCHEMA_MODE[mode];
  }

  for (const meta of Object.values(HUB_UI_TEMPLATE_META)) {
    if (meta.label === key || meta.id === key) {
      const badge = resolveHubUiTemplateBadge(meta.id);
      return { icon: badge.iconMeta!.icon, className: badge.iconMeta!.className };
    }
  }
  for (const meta of Object.values(HUB_APP_TAB_GROUP_META)) {
    if (meta.label === key || meta.id === key) {
      const badge = resolveHubAppTabGroupBadge(meta.id);
      return { icon: badge.iconMeta!.icon, className: badge.iconMeta!.className };
    }
  }

  return (
    pick(CHART_LEGEND_EXTRA, key) ??
    pick(STATUS_HEALTH, key) ??
    pick(CATEGORY, key) ??
    pick(DEPLOY, key) ??
    pick(SCHEMA_GROUP, key) ??
    null
  );
}

/** Hub deploy chip spec — reused for link group `vercel` and deployTarget fields. */
export function resolveDeployBadge(target?: string): BadgeSpec {
  const label = deployLabel(target);
  const iconMeta = pick(DEPLOY, label) ?? { icon: Rocket, className: "text-sky-300/90" };
  return { label, iconMeta, tone: "neutral" };
}

/**
 * Tool Links GROUP column — same label/icon/tone as Hub where types overlap.
 * `vercel` → Hub "Vercel" (Cloud · sky), not uppercase VERCEL / slate variant.
 */
export function resolveLinkGroupBadge(group: LinkGroup): BadgeSpec {
  const label = linkGroupFilterLabel(group);
  switch (group) {
    case "vercel":
      return resolveDeployBadge("vercel");
    case "web":
      return {
        label,
        iconMeta: pick(CATEGORY, "Web") ?? { icon: Monitor, className: "text-indigo-400" },
        tone: "neutral",
      };
    case "github":
      return {
        label,
        iconMeta: pick(DEPLOY, "GitHub Pages") ?? { icon: Github, className: "text-violet-300" },
        tone: "neutral",
      };
    case "supabase":
      return { label, iconMeta: { icon: Database, className: "text-emerald-300" }, tone: "neutral" };
    case "meta":
      return { label, iconMeta: { icon: Tag, className: "text-slate-400" }, tone: "neutral" };
    default:
      return { label, iconMeta: { icon: Tag, className: "text-slate-400" }, tone: "neutral" };
  }
}

export function resolveLinkStatusBadge(status: string): BadgeSpec {
  const label = LINK_STATUS_LABEL[status] ?? status;
  const iconMeta = LINK_STATUS[status] ?? LINK_STATUS.unknown;
  return { label, iconMeta, tone: LINK_STATUS_TONE[status] ?? "neutral" };
}

export function resolveLinkKindBadge(kind: string): BadgeSpec {
  const label = LINK_KIND_LABEL[kind] ?? kind;
  const iconMeta = LINK_KIND[kind] ?? LINK_KIND.id;
  return { label, iconMeta, tone: "neutral" };
}

export type BadgePreviewSection = { title: string; items: BadgeSpec[] };

/** Design Template — full registry listing */
export function badgeRegistryPreviewSections(): BadgePreviewSection[] {
  return [
    {
      title: "Deploy (Hub canonical)",
      items: (["vercel", "github-pages", "github-release", "vps", "local"] as const).map((t) =>
        resolveDeployBadge(t),
      ),
    },
    {
      title: "Link groups (Tool Links)",
      items: (["web", "vercel", "supabase", "github", "meta"] as LinkGroup[]).map(resolveLinkGroupBadge),
    },
    {
      title: "Link status",
      items: Object.keys(LINK_STATUS_LABEL).map(resolveLinkStatusBadge),
    },
    {
      title: "Link kind",
      items: Object.keys(LINK_KIND_LABEL).map(resolveLinkKindBadge),
    },
    {
      title: "Health / status",
      items: Object.keys(STATUS_HEALTH).map((label) => ({
        label,
        iconMeta: STATUS_HEALTH[label],
        tone: (label === "Ready" || label === "Active" ? "ok" : "neutral") as MetricBadgeTone,
      })),
    },
    {
      title: "Category",
      items: Object.keys(CATEGORY).map((label) => ({
        label,
        iconMeta: CATEGORY[label],
        tone: "neutral" as MetricBadgeTone,
      })),
    },
    {
      title: "Schema groups",
      items: Object.keys(SCHEMA_GROUP).map((group) => ({
        label: group,
        iconMeta: SCHEMA_GROUP[group],
        tone: "neutral" as MetricBadgeTone,
      })),
    },
    {
      title: "Schema modes",
      items: (Object.keys(SCHEMA_MODE) as Mode[]).map((mode) => ({
        label: MODE_LABEL_SHORT[mode],
        iconMeta: SCHEMA_MODE[mode],
        tone: "neutral" as MetricBadgeTone,
      })),
    },
  ];
}

