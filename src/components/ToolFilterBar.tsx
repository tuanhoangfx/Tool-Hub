import { STATUS_ORDER } from "../lib/tooling";
import { compactIconSize } from "../lib/ui-scale";
import { MaterialIcon } from "./MaterialIcon";

const CHIP_META: Record<string, { label: string; icon: string }> = {
  All: { label: "All", icon: "apps" },
  Ready: { label: "Ready", icon: "check_circle" },
  "Needs review": { label: "Review", icon: "rate_review" },
  Experimental: { label: "Beta", icon: "science" },
  Archived: { label: "Archive", icon: "inventory" },
};

export type ViewMode = "grid" | "table";

type ToolFilterBarProps = {
  query: string;
  shown: number;
  total: number;
  onQueryChange: (value: string) => void;
  statusFilter?: string;
  onStatusFilterChange?: (value: string) => void;
  viewMode?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
};

export function ToolFilterBar({
  query,
  shown,
  total,
  onQueryChange,
  statusFilter = "All",
  onStatusFilterChange,
  viewMode,
  onViewModeChange,
}: ToolFilterBarProps) {
  const chips = ["All", ...STATUS_ORDER];

  return (
    <div className="filter-toolbar" role="search">
      <div className="filter-toolbar-row">
        <label className="search-box grow">
          <MaterialIcon name="search" size={compactIconSize(18)} />
          <input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search tool, repo, tag..."
            type="search"
            aria-label="Search tools"
          />
        </label>
        {onStatusFilterChange ? (
          <div className="filter-chips" role="group" aria-label="Status filters">
            {chips.map((status) => {
              const meta = CHIP_META[status] ?? { label: status, icon: "label" };
              return (
                <button
                  key={status}
                  className={statusFilter === status ? "chip active" : "chip"}
                  type="button"
                  onClick={() => onStatusFilterChange(status)}
                >
                  <MaterialIcon name={meta.icon} size={compactIconSize(15)} />
                  {meta.label}
                </button>
              );
            })}
          </div>
        ) : null}
        <span className="filter-meta">
          <MaterialIcon name="filter_alt" size={compactIconSize(14)} />
          {shown}/{total}
        </span>
        {viewMode && onViewModeChange ? (
          <div className="view-toggle" role="group" aria-label="View mode">
            <button
              type="button"
              className={viewMode === "grid" ? "toggle-btn active" : "toggle-btn"}
              onClick={() => onViewModeChange("grid")}
              aria-pressed={viewMode === "grid"}
              aria-label="Card view"
            >
              <MaterialIcon name="grid_view" size={compactIconSize(14)} />
              <span>Cards</span>
            </button>
            <button
              type="button"
              className={viewMode === "table" ? "toggle-btn active" : "toggle-btn"}
              onClick={() => onViewModeChange("table")}
              aria-pressed={viewMode === "table"}
              aria-label="Table view"
            >
              <MaterialIcon name="table_rows" size={compactIconSize(14)} />
              <span>Table</span>
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
