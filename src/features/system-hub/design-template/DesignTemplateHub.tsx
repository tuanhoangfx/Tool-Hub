import { useEffect, useState } from "react";
import { Palette } from "lucide-react";
import {
  HubResultCount,
  HubTimeRangeSelect,
  ViewToggle,
  type FilterValues,
  type HubViewMode,
} from "../../../components/sales-shell";
import { useSessionState } from "../../../hooks";
import { readHubListPrefs } from "../../../lib/url-prefs";
import { SystemHubShell } from "../SystemHubShell";
import { SupabaseQuotaDesignPreview } from "./SupabaseQuotaDesignPreview";

function readDesignTemplateScreen() {
  if (typeof window === "undefined") return null;
  const p = new URLSearchParams(window.location.search);
  return p.get("dtpl") ?? p.get("dt");
}

export function DesignTemplateHub() {
  const [query, setQuery] = useState("");
  const [filterValues, setFilterValues] = useState<FilterValues>({});
  const [prefs, setPrefs] = useState(readHubListPrefs);
  const [viewMode, setViewMode] = useSessionState<HubViewMode>("system:design-template:viewMode", "card");
  const [dt, setDt] = useState<string | null>(() => readDesignTemplateScreen());

  useEffect(() => {
    const sync = () => {
      setPrefs(readHubListPrefs());
      setDt(readDesignTemplateScreen());
    };
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);

  if (dt === "supabase-quota") {
    return <SupabaseQuotaDesignPreview />;
  }

  return (
    <SystemHubShell
      placeholder="Search Design Template by active design name..."
      query={query}
      onQueryChange={setQuery}
      values={filterValues}
      onValuesChange={setFilterValues}
      toolbar={
        <>
          <HubTimeRangeSelect value={prefs.range} />
          <ViewToggle value={viewMode} onChange={setViewMode} />
          <HubResultCount icon={Palette} shown={0} total={0} label="designs" />
        </>
      }
      kpiItems={[]}
    >
      <div className="px-6 py-6">
        <div className="mb-3 text-sm font-semibold text-[var(--text)]">Active review</div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <button
            type="button"
            className="group rounded-2xl border border-white/10 bg-white/[.02] p-4 text-left transition-colors hover:bg-white/[.04]"
            onClick={() => {
              const p = new URLSearchParams(window.location.search);
              p.set("screen", "system");
              p.set("stab", "template");
              p.set("dtpl", "supabase-quota");
              p.delete("dt");
              if (!p.get("sqv")) p.set("sqv", "V1");
              window.history.replaceState(null, "", `${window.location.pathname}?${p.toString()}`);
              window.dispatchEvent(new PopStateEvent("popstate"));
            }}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-[var(--text)]">Supabase Quota</div>
                <div className="mt-1 text-xs text-[var(--muted)]">V1–V5 design preview (Design Template)</div>
              </div>
              <span className="rounded-full bg-indigo-500/10 px-2 py-0.5 text-[10px] font-semibold text-indigo-200">
                NEW
              </span>
            </div>
            <div className="mt-3 text-xs text-[var(--muted)]">
              Click to open inside <span className="font-semibold text-[var(--text)]/80">System → Design Template</span>.
            </div>
          </button>
        </div>
      </div>
    </SystemHubShell>
  );
}
