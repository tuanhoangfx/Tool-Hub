import { useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { ExternalLink, X } from "lucide-react";
import { MetricBadge } from "../../components/sales-shell/MetricBadge";
import { compactIconSize } from "../../lib/ui-scale";
import { resolveDeployBadge } from "../../lib/badge-registry";
import type { ResolvedTool } from "../../types";
import { SupabaseProjectToolBadges } from "./SupabaseProjectToolBadges";
import type { HostingDeployRow } from "./hosting-quota-types";

export type HostingDeployDetailModalProps = {
  row: HostingDeployRow | null;
  tools: ResolvedTool[];
  onClose: () => void;
};

export function HostingDeployDetailModal({ row, tools, onClose }: HostingDeployDetailModalProps) {
  const linked = useMemo(() => {
    if (!row) return [];
    return row.toolCodes.map((code) => tools.find((t) => t.code === code)).filter(Boolean) as ResolvedTool[];
  }, [row, tools]);

  useEffect(() => {
    if (!row) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    document.body.classList.add("hub-modal-open");
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.classList.remove("hub-modal-open");
    };
  }, [row, onClose]);

  if (!row) return null;

  const deploy = resolveDeployBadge(row.provider);
  const ProviderIcon = deploy.iconMeta.icon;

  return createPortal(
    <div className="modal-backdrop modal-backdrop--tool-detail" role="presentation" onClick={onClose}>
      <div
        className="modal-shell modal-shell--tool-detail"
        role="dialog"
        aria-modal="true"
        aria-label={`${row.name} hosting`}
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="modal-close modal-close--tool-detail" onClick={onClose} aria-label="Close">
          <X size={compactIconSize(16)} />
        </button>
        <div className="modal-shell__scroll space-y-4 p-6">
          <div className="flex flex-wrap items-start gap-3">
            <ProviderIcon size={compactIconSize(28)} className="shrink-0 text-indigo-300" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <MetricBadge label={row.ref} mono />
                <h2 className="text-lg font-semibold text-[var(--text)]">{row.name}</h2>
              </div>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {row.providerLabel} · {row.hostSlug}
              </p>
            </div>
          </div>

          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            {[
              ["Region / provider", row.region ?? "—"],
              ["Plan / status", row.plan ?? row.status],
              ["Health", row.healthLabel],
              ["Service", row.serviceKind ? `${row.serviceKind}${row.serviceStatus ? ` · ${row.serviceStatus}` : ""}` : "—"],
            ].map(([k, v]) => (
              <div key={k} className="rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2">
                <dt className="text-[10px] font-semibold uppercase tracking-wide text-[var(--muted)]">{k}</dt>
                <dd className="mt-0.5 text-[var(--text)]">{v}</dd>
              </div>
            ))}
          </dl>

          {row.publicUrl ? (
            <a
              href={row.publicUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-indigo-300 hover:underline"
            >
              <ExternalLink size={compactIconSize(14)} />
              {row.publicUrl}
            </a>
          ) : null}

          {row.note ? (
            <p className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-[12px] text-amber-100/90">{row.note}</p>
          ) : null}

          {row.error || row.driftCount > 0 ? (
            <p className="rounded-lg border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-[12px] text-rose-200">
              {row.error ?? `${row.driftCount} drift alert(s) on linked tool(s)`}
            </p>
          ) : null}

          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Linked tools</h3>
            <SupabaseProjectToolBadges tools={row.toolCodes} maxVisible={12} />
            {linked.length > 0 ? (
              <ul className="mt-3 space-y-2">
                {linked.map((t) => (
                  <li key={t.id} className="rounded-lg border border-white/5 px-3 py-2 text-[12px]">
                    <span className="font-mono text-indigo-200/90">{t.code}</span>
                    <span className="mx-2 text-[var(--muted)]">·</span>
                    <span className="text-[var(--text)]">{t.name}</span>
                    <span className="ml-2 text-[var(--muted)]">{t.status}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[12px] text-[var(--muted)]">No workspace catalog match for tool codes on this deployment.</p>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
