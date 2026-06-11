import { AtSign, Cloud, Globe2, HardDrive, Layers, Pencil, Server, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { MetricBadge } from "../../components/sales-shell/MetricBadge";
import { HubCardAvatar } from "../../components/HubCardAvatar";
import { compactIconSize } from "@tool-workspace/hub-ui";
import { resolveHealthStatusIcon } from "../../lib/badge-registry";
import { QuietChip } from "../hub/hub-tool-ui";
import { SupabaseProjectToolBadges } from "./SupabaseProjectToolBadges";
import type { HostingDeployRow } from "./hosting-quota-types";

const META: Record<string, { Icon: LucideIcon; tint: string }> = {
  host: { Icon: Server, tint: "#38bdf8" },
  region: { Icon: Globe2, tint: "#a78bfa" },
  plan: { Icon: Layers, tint: "#34d399" },
  url: { Icon: HardDrive, tint: "#60a5fa" },
};

function MetaRow({ kind, children }: { kind: keyof typeof META; children: ReactNode }) {
  const { Icon, tint } = META[kind];
  return (
    <div className="flex items-center gap-2">
      <Icon size={compactIconSize(12)} className="shrink-0" strokeWidth={2} style={{ color: tint, opacity: 0.72 }} />
      <div className="min-w-0 flex-1 truncate">{children}</div>
    </div>
  );
}

function statusDotColor(row: HostingDeployRow) {
  if (row.error) return "#f43f5e";
  if (row.driftCount > 0) return "#f59e0b";
  if (!row.publicUrl) return "#94a3b8";
  return "#22c55e";
}

function refBadgeClass(provider: HostingDeployRow["provider"]) {
  if (provider === "vercel") return "border-sky-400/35 bg-sky-500/12 text-sky-200";
  if (provider === "vps") return "border-amber-400/35 bg-amber-500/12 text-amber-200";
  return "border-white/12 bg-white/[0.06] text-[var(--muted)]";
}

type HostingDeployCardProps = {
  row: HostingDeployRow;
  onOpen: (id: string) => void;
};

function providerIcon(provider: HostingDeployRow["provider"]): LucideIcon {
  if (provider === "vercel") return Cloud;
  if (provider === "vps") return Server;
  return Server;
}

export function HostingDeployCard({ row, onOpen }: HostingDeployCardProps) {
  const CardIcon = providerIcon(row.provider);
  const refShort = row.ref.length > 10 ? row.ref.slice(0, 10) : row.ref;
  const healthTone = row.error || row.driftCount > 0 ? "bad" : row.publicUrl ? "ok" : "warn";

  return (
    <button
      type="button"
      onClick={() => onOpen(row.id)}
      className={`group flex h-full min-h-[var(--hub-card-min-h)] w-full flex-col rounded-xl border border-white/5 bg-[var(--panel)] p-4 text-left transition-[border-color,box-shadow,background-color] duration-200 hover:border-indigo-500/40 hover:bg-white/[0.02] hover:shadow-[0_8px_24px_rgba(99,102,241,0.12)] ${
        row.driftCount > 0 ? "border-amber-500/30" : ""
      }`}
    >
      <div className="mb-3 flex shrink-0 items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <HubCardAvatar
            variant="agent"
            icon={CardIcon}
            size="sm"
            statusColor={statusDotColor(row)}
            statusTitle={row.healthLabel}
          />
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5">
              <MetricBadge label={refShort} mono variantClass={refBadgeClass(row.provider)} />
              <span className="min-w-0 line-clamp-2 text-sm font-medium leading-snug text-[var(--text)]">{row.name}</span>
            </div>
          </div>
        </div>
        <Pencil size={compactIconSize(14)} className="shrink-0 text-[var(--muted)] opacity-0 transition-opacity group-hover:opacity-100" />
      </div>

      <div className="min-h-[var(--hub-card-meta-min-h)] shrink-0 space-y-1.5 text-xs text-[var(--muted)]">
        <MetaRow kind="host">
          <span className="flex min-w-0 items-center gap-2 truncate">
            <span className="shrink-0 font-mono text-[11px] text-indigo-200/90">{row.providerLabel}</span>
            <span className="shrink-0 text-[var(--muted)]/45" aria-hidden>
              ·
            </span>
            <span className="flex min-w-0 items-center gap-1 truncate text-[11px] text-[var(--text)]/85">
              <AtSign size={compactIconSize(10)} className="shrink-0 text-pink-300/75" strokeWidth={2} aria-hidden />
              <span className="min-w-0 truncate" title={row.hostSlug}>
                {row.hostSlug}
              </span>
            </span>
          </span>
        </MetaRow>
        <MetaRow kind="region">
          <span className="font-medium text-[var(--text)]">{row.region?.trim() || "—"}</span>
        </MetaRow>
        <MetaRow kind="plan">
          <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            <span className="shrink-0 font-medium text-[var(--text)]">{row.plan?.trim() || row.status || "—"}</span>
            {row.toolCodes.length > 0 ? <SupabaseProjectToolBadges tools={row.toolCodes} maxVisible={3} /> : null}
          </span>
        </MetaRow>
        <MetaRow kind="url">
          <span className="font-medium text-[var(--text)]">
            {row.publicUrl ? (
              <a
                href={row.publicUrl}
                target="_blank"
                rel="noreferrer"
                className="text-indigo-300 underline-offset-2 hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {row.publicUrl.replace(/^https?:\/\//, "")}
              </a>
            ) : (
              "—"
            )}
            <span className="ml-1 text-[10px] text-[var(--muted)]">URL</span>
          </span>
        </MetaRow>
      </div>

      <div className="mt-auto shrink-0 pt-3">
        <div className="flex min-h-[var(--hub-card-chip-row-min-h)] flex-wrap items-center gap-1.5">
          {row.driftCount > 0 ? (
            <QuietChip
              label={`Drift ${row.driftCount}`}
              tone="bad"
              title={row.error ?? "Manifest / registry drift"}
              iconMeta={resolveHealthStatusIcon("Needs review")}
            />
          ) : row.error ? (
            <QuietChip label="Error" tone="bad" title={row.error} iconMeta={resolveHealthStatusIcon("Error")} />
          ) : (
            <QuietChip
              label={row.healthLabel}
              tone={healthTone}
              title={row.serviceStatus ? `Service: ${row.serviceStatus}` : row.healthLabel}
              iconMeta={resolveHealthStatusIcon(row.healthLabel)}
            />
          )}
        </div>
        {row.note ? (
          <p className="mt-2 line-clamp-2 text-[10px] leading-snug text-[var(--muted)]">{row.note}</p>
        ) : null}
      </div>
    </button>
  );
}
