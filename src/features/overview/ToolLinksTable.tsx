import { useMemo, useState } from "react";
import { Check, Copy, ExternalLink, RefreshCcw } from "lucide-react";
import { FilterBar, RegistryMetricBadge } from "../../components/sales-shell";
import {
  resolveLinkGroupBadge,
  resolveLinkKindBadge,
  resolveLinkStatusBadge,
} from "../../lib/badge-registry";
import { useLocalHealth, type HealthState } from "../../hooks/useLocalHealth";
import type { ToolLinkRow } from "./tool-links";
import {
  LINK_FILTER_DEFS,
  linkGroup,
  linkKind,
  linkPingUrl,
  matchesLinkFilters,
} from "./tool-link-filters";
import { useLinkFilterPrefs } from "./use-link-filter-prefs";

function StatusBadge({ state }: { state: HealthState | "na" }) {
  return (
    <RegistryMetricBadge
      spec={resolveLinkStatusBadge(state)}
      className={`text-[9px] ${state === "checking" ? "animate-pulse" : ""}`}
    />
  );
}

function KindBadge({ link }: { link: ToolLinkRow }) {
  return <RegistryMetricBadge spec={resolveLinkKindBadge(linkKind(link))} className="text-[9px]" />;
}

function GroupBadge({ linkId }: { linkId: string }) {
  return <RegistryMetricBadge spec={resolveLinkGroupBadge(linkGroup(linkId))} className="text-[9px]" />;
}

function LinkActions({
  link,
  copiedId,
  onCopy,
}: {
  link: ToolLinkRow;
  copiedId: string | null;
  onCopy: (link: ToolLinkRow) => void;
}) {
  return (
    <div className="flex items-center justify-end gap-1">
      <button
        type="button"
        onClick={() => onCopy(link)}
        className="inline-flex items-center justify-center rounded-md border border-white/10 p-1.5 text-[var(--muted)] hover:bg-white/[.05] hover:text-indigo-300"
        title="Copy value"
        aria-label={`Copy ${link.label}`}
      >
        {copiedId === link.id ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
      </button>
      {link.href ? (
        <a
          href={link.href}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center rounded-md border border-white/10 p-1.5 text-[var(--muted)] hover:bg-white/[.05] hover:text-cyan-300"
          title={`Open ${link.label}`}
        >
          <ExternalLink size={12} />
        </a>
      ) : null}
    </div>
  );
}

function UrlCell({ link }: { link: ToolLinkRow }) {
  if (link.href) {
    return (
      <a
        href={link.href}
        target="_blank"
        rel="noreferrer"
        className="break-all font-mono text-[11px] text-cyan-300/90 hover:text-cyan-200 hover:underline"
      >
        {link.value}
      </a>
    );
  }
  return <span className="break-all font-mono text-[11px] text-[var(--muted)]">{link.value}</span>;
}

export type ToolLinksPanelProps = {
  links: ToolLinkRow[];
  /** Tool code for per-tool filter persistence (localStorage). */
  toolCode: string;
};

/** V4a (locked): status ping · filter bar · link table · copy/open · recheck health. */
export function ToolLinksPanel({ links, toolCode }: ToolLinksPanelProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { query, setQuery, filterValues, setFilterValues } = useLinkFilterPrefs(toolCode);

  const pingTargets = useMemo(
    () => [...new Set(links.map(linkPingUrl).filter((u): u is string => Boolean(u)))],
    [links],
  );
  const { state: healthState, check } = useLocalHealth(pingTargets);
  const checking = pingTargets.some((u) => healthState[u] === "checking");

  const filtered = useMemo(
    () => links.filter((link) => matchesLinkFilters(link, query, filterValues, healthState)),
    [links, query, filterValues, healthState],
  );

  async function copyValue(link: ToolLinkRow) {
    try {
      await navigator.clipboard.writeText(link.value);
      setCopiedId(link.id);
      window.setTimeout(() => setCopiedId((c) => (c === link.id ? null : c)), 1500);
    } catch {
      // ignore
    }
  }

  if (links.length === 0) {
    return <p className="text-[12px] text-[var(--muted)]">No links or IDs found in manifest or registry yet.</p>;
  }

  const rowStatus = (link: ToolLinkRow): HealthState | "na" => {
    const url = linkPingUrl(link);
    if (!url) return "na";
    return healthState[url] ?? "unknown";
  };

  return (
    <div className="space-y-2">
      <FilterBar
        placeholder="Search label, URL, ID..."
        filters={LINK_FILTER_DEFS}
        query={query}
        onQueryChange={setQuery}
        values={filterValues}
        onValuesChange={setFilterValues}
        trailing={
          <>
            {pingTargets.length > 0 ? (
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-[var(--panel-2)] px-3 py-1.5 text-xs text-[var(--text)] hover:bg-white/5 disabled:opacity-50"
                onClick={() => void check()}
                disabled={checking}
              >
                <RefreshCcw size={12} className={checking ? "anim-spin" : ""} />
                Recheck health
              </button>
            ) : null}
            <span className="hidden text-[10px] text-[var(--muted)] sm:inline">
              {filtered.length}/{links.length}
            </span>
          </>
        }
      />

      {filtered.length === 0 ? (
        <p className="rounded-lg border border-white/5 bg-white/[.02] px-3 py-6 text-center text-[12px] text-[var(--muted)]">
          No links match search or filters.
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-white/5">
          <table className="w-full border-collapse text-left text-[12px]">
            <thead>
              <tr className="border-b border-white/5 bg-white/[.02] text-[10px] uppercase tracking-wider text-[var(--muted)]">
                <th className="w-24 px-2 py-2 font-medium">Status</th>
                <th className="w-20 px-2 py-2 font-medium">Type</th>
                <th className="w-28 px-2 py-2 font-medium">Group</th>
                <th className="px-3 py-2 font-medium">Link</th>
                <th className="px-3 py-2 font-medium">URL / ID</th>
                <th className="w-24 px-2 py-2 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((link) => (
                <tr key={`${link.id}-${link.value}`} className="border-b border-white/5 last:border-0 hover:bg-white/[.02]">
                  <td className="px-2 py-2 align-top">
                    <StatusBadge state={rowStatus(link)} />
                  </td>
                  <td className="px-2 py-2 align-top">
                    <KindBadge link={link} />
                  </td>
                  <td className="px-2 py-2 align-top">
                    <GroupBadge linkId={link.id} />
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 align-top font-medium text-[var(--text)]">{link.label}</td>
                  <td className="px-3 py-2 align-top">
                    <UrlCell link={link} />
                  </td>
                  <td className="px-2 py-2 align-top">
                    <LinkActions link={link} copiedId={copiedId} onCopy={copyValue} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
