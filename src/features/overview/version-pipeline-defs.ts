import {
  Activity,
  Calendar,
  FileJson,
  FileText,
  GitBranch,
  MessageSquare,
  MoreHorizontal,
  Package,
  Rocket,
  ScrollText,
  Tag,
  UploadCloud,
  type LucideIcon,
} from "lucide-react";
import type { ToolVersionHistoryRow } from "./tool-versions";

export type PipelineColKey = keyof Pick<
  ToolVersionHistoryRow,
  "onManifest" | "onPackage" | "inChangelog" | "onGit" | "onPush" | "onRelease"
>;

export type PipelineColDef = {
  key: PipelineColKey;
  label: string;
  shortLabel: string;
  title: string;
  icon: LucideIcon;
  iconClass: string;
};

export const VERSION_PIPELINE_COLS: PipelineColDef[] = [
  {
    key: "onPackage",
    label: "package.json",
    shortLabel: "Package",
    title: "package.json version field",
    icon: Package,
    iconClass: "text-sky-400",
  },
  {
    key: "inChangelog",
    label: "CHANGELOG",
    shortLabel: "Changelog",
    title: "CHANGELOG.md Version entry",
    icon: ScrollText,
    iconClass: "text-fuchsia-300",
  },
  {
    key: "onManifest",
    label: "Manifest",
    shortLabel: "Manifest",
    title: "tool.manifest.json release.version / latestPublished",
    icon: FileJson,
    iconClass: "text-violet-300",
  },
  {
    key: "onGit",
    label: "Git tag",
    shortLabel: "Git",
    title: "GitHub tag or changelog commit",
    icon: GitBranch,
    iconClass: "text-amber-300",
  },
  {
    key: "onPush",
    label: "Push remote",
    shortLabel: "Push",
    title: "Code/metadata pushed to GitHub (remote matches or release exists)",
    icon: UploadCloud,
    iconClass: "text-cyan-300",
  },
  {
    key: "onRelease",
    label: "Release",
    shortLabel: "Release",
    title: "GitHub Release published for the tag",
    icon: Rocket,
    iconClass: "text-indigo-300",
  },
];

export const VERSION_TABLE_HEADERS = {
  sync: { label: "Sync", icon: Activity, iconClass: "text-emerald-300/90", title: "Pipeline status" },
  version: { label: "Version", icon: Tag, iconClass: "text-indigo-300", title: "Version number" },
  released: { label: "Release date", icon: Calendar, iconClass: "text-slate-400", title: "Release or changelog date" },
  title: { label: "Title", icon: FileText, iconClass: "text-slate-400", title: "Changelog section title" },
  note: { label: "Notes", icon: MessageSquare, iconClass: "text-amber-300/80", title: "Next action" },
  actions: { label: "Actions", icon: MoreHorizontal, iconClass: "text-slate-400", title: "Copy · open release" },
} as const;
