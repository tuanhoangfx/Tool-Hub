import type { LucideIcon } from "lucide-react";
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

/** Thứ tự pipeline: package → changelog → manifest → git → push → release */
export const VERSION_PIPELINE_COLS: PipelineColDef[] = [
  {
    key: "onPackage",
    label: "package.json",
    shortLabel: "Package",
    title: "package.json — trường version",
    icon: Package,
    iconClass: "text-sky-400",
  },
  {
    key: "inChangelog",
    label: "CHANGELOG",
    shortLabel: "Changelog",
    title: "CHANGELOG.md — mục Version",
    icon: ScrollText,
    iconClass: "text-fuchsia-300",
  },
  {
    key: "onManifest",
    label: "Manifest",
    shortLabel: "Manifest",
    title: "tool.manifest.json — release.version / latestPublished",
    icon: FileJson,
    iconClass: "text-violet-300",
  },
  {
    key: "onGit",
    label: "Git tag",
    shortLabel: "Git",
    title: "Tag trên GitHub hoặc Commit trong changelog",
    icon: GitBranch,
    iconClass: "text-amber-300",
  },
  {
    key: "onPush",
    label: "Push remote",
    shortLabel: "Push",
    title: "Code/metadata đã lên GitHub (remote khớp hoặc đã release)",
    icon: UploadCloud,
    iconClass: "text-cyan-300",
  },
  {
    key: "onRelease",
    label: "Release",
    shortLabel: "Release",
    title: "GitHub Release — publish tag",
    icon: Rocket,
    iconClass: "text-indigo-300",
  },
];

export function PipelineColumnHeader({ col }: { col: PipelineColDef }) {
  const Icon = col.icon;
  return (
    <th className="min-w-[5.5rem] px-1.5 py-2 text-center font-medium" title={col.title}>
      <span className="mx-auto inline-flex items-center justify-center gap-1 normal-case tracking-normal">
        <Icon size={13} className={`shrink-0 ${col.iconClass}`} aria-hidden />
        <span className="text-[10px] leading-none text-[var(--text)]">{col.shortLabel}</span>
      </span>
    </th>
  );
}

export const VERSION_TABLE_HEADERS = {
  sync: { label: "Đồng bộ", icon: Activity, iconClass: "text-emerald-300/90", title: "Trạng thái pipeline" },
  version: { label: "Phiên bản", icon: Tag, iconClass: "text-indigo-300", title: "Số version" },
  released: { label: "Ngày PH", icon: Calendar, iconClass: "text-slate-400", title: "Ngày release / changelog" },
  title: { label: "Tiêu đề", icon: FileText, iconClass: "text-slate-400", title: "Tiêu đề mục changelog" },
  note: { label: "Ghi chú", icon: MessageSquare, iconClass: "text-amber-300/80", title: "Việc cần làm tiếp" },
  actions: { label: "Thao tác", icon: MoreHorizontal, iconClass: "text-slate-400", title: "Copy · mở release" },
} as const;

export function TableColumnHeader({
  label,
  icon: Icon,
  iconClass,
  title,
  align = "left",
}: {
  label: string;
  icon: LucideIcon;
  iconClass: string;
  title: string;
  align?: "left" | "center" | "right";
}) {
  const alignClass =
    align === "center" ? "text-center" : align === "right" ? "text-right" : "text-left";
  return (
    <th className={`px-2 py-2 font-medium ${alignClass}`} title={title}>
      <span
        className={`inline-flex items-center gap-1 normal-case tracking-normal ${
          align === "center" ? "mx-auto justify-center" : align === "right" ? "ml-auto justify-end" : ""
        }`}
      >
        <Icon size={13} className={iconClass} aria-hidden />
        <span className="text-[10px] text-[var(--muted)]">{label}</span>
      </span>
    </th>
  );
}
