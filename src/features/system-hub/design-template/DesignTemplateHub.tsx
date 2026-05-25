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

export function DesignTemplateHub() {
  const [query, setQuery] = useState("");
  const [filterValues, setFilterValues] = useState<FilterValues>({});
  const [prefs, setPrefs] = useState(readHubListPrefs);
  const [viewMode, setViewMode] = useSessionState<HubViewMode>("system:design-template:viewMode", "card");

  useEffect(() => {
    const sync = () => setPrefs(readHubListPrefs());
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);

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
      <div
        className={`flex min-h-[40vh] items-center justify-center px-6 text-sm text-[var(--muted)] ${
          viewMode === "table" ? "rounded-2xl border border-white/5 bg-[var(--panel)]" : ""
        }`}
      >
        No active designs
      </div>
    </SystemHubShell>
  );
}
