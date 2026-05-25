import {
  AlertTriangle,
  BookOpen,
  Calendar,
  CheckCircle2,
  FileJson,
  Github,
  Hash,
  HelpCircle,
  Package,
  Tag,
} from "lucide-react";
import type { BadgeSpec } from "./badge-registry";

export type VersionSourceGroup = "local" | "manifest" | "github" | "docs" | "registry";

export type VersionRowStatus = "ok" | "warn" | "drift" | "missing" | "na";

export type VersionFieldKind = "version" | "date" | "tag" | "path";

const GROUP_LABEL: Record<VersionSourceGroup, string> = {
  local: "Local files",
  manifest: "Manifest",
  github: "GitHub",
  docs: "Docs",
  registry: "Registry",
};

const KIND_LABEL: Record<VersionFieldKind, string> = {
  version: "Version",
  date: "Date",
  tag: "Tag",
  path: "Path",
};

const STATUS_LABEL: Record<VersionRowStatus, string> = {
  ok: "OK",
  warn: "Warn",
  drift: "Drift",
  missing: "Missing",
  na: "N/A",
};

export function resolveVersionGroupBadge(group: VersionSourceGroup): BadgeSpec {
  const label = GROUP_LABEL[group];
  switch (group) {
    case "local":
      return { label, iconMeta: { icon: Package, className: "text-sky-400" }, tone: "neutral" };
    case "manifest":
      return { label, iconMeta: { icon: FileJson, className: "text-violet-300" }, tone: "neutral" };
    case "github":
      return { label, iconMeta: { icon: Github, className: "text-violet-300" }, tone: "neutral" };
    case "docs":
      return { label, iconMeta: { icon: BookOpen, className: "text-slate-400" }, tone: "neutral" };
    case "registry":
      return { label, iconMeta: { icon: Tag, className: "text-emerald-300" }, tone: "neutral" };
    default:
      return { label, iconMeta: { icon: Tag, className: "text-slate-400" }, tone: "neutral" };
  }
}

export function resolveVersionKindBadge(kind: VersionFieldKind): BadgeSpec {
  const label = KIND_LABEL[kind];
  const icon =
    kind === "version" ? Hash : kind === "date" ? Calendar : kind === "tag" ? Tag : FileJson;
  return { label, iconMeta: { icon, className: "text-slate-400" }, tone: "neutral" };
}

export type VersionSyncStatus = "current" | "synced" | "needs-push" | "needs-sync" | "history";

const SYNC_LABEL: Record<VersionSyncStatus, string> = {
  current: "Current",
  synced: "Synced",
  "needs-push": "Needs push",
  "needs-sync": "Needs sync",
  history: "History",
};

export function resolveVersionSyncBadge(status: VersionSyncStatus): BadgeSpec {
  const label = SYNC_LABEL[status];
  switch (status) {
    case "synced":
      return { label, iconMeta: { icon: CheckCircle2, className: "text-emerald-400" }, tone: "ok" };
    case "current":
      return { label, iconMeta: { icon: Tag, className: "text-indigo-300" }, tone: "neutral" };
    case "needs-push":
      return { label, iconMeta: { icon: AlertTriangle, className: "text-amber-400" }, tone: "warn" };
    case "needs-sync":
      return { label, iconMeta: { icon: AlertTriangle, className: "text-rose-400" }, tone: "warn" };
    default:
      return { label, iconMeta: { icon: Tag, className: "text-slate-400" }, tone: "neutral" };
  }
}

export function resolveVersionStatusBadge(status: VersionRowStatus): BadgeSpec {
  const label = STATUS_LABEL[status];
  const iconMeta =
    status === "ok"
      ? { icon: CheckCircle2, className: "text-emerald-400" }
      : status === "drift"
        ? { icon: AlertTriangle, className: "text-rose-400" }
        : status === "missing"
          ? { icon: HelpCircle, className: "text-slate-400" }
          : { icon: AlertTriangle, className: "text-amber-400" };
  const tone = status === "ok" ? "ok" : status === "drift" ? "warn" : "neutral";
  return { label, iconMeta, tone };
}
