import type { LucideIcon } from "lucide-react";
import { compactIconSize } from "@tool-workspace/hub-ui";
import type { PipelineColDef } from "./version-pipeline-defs";

export function PipelineColumnHeader({ col }: { col: PipelineColDef }) {
  const Icon = col.icon;
  return (
    <th className="min-w-[5.5rem] px-1.5 py-2 text-center font-medium" title={col.title}>
      <span className="mx-auto inline-flex items-center justify-center gap-1 normal-case tracking-normal">
        <Icon size={compactIconSize(13)} className={`shrink-0 ${col.iconClass}`} aria-hidden />
        <span className="text-[10px] leading-none text-[var(--text)]">{col.shortLabel}</span>
      </span>
    </th>
  );
}

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
        <Icon size={compactIconSize(13)} className={iconClass} aria-hidden />
        <span className="text-[10px] text-[var(--muted)]">{label}</span>
      </span>
    </th>
  );
}
