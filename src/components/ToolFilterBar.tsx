import { STATUS_ORDER } from "../lib/tooling";
import type { ResolvedTool } from "../types";
import { MaterialIcon } from "./MaterialIcon";

const CHIP_META: Record<string, { label: string; icon: string }> = {
  All: { label: "Tất cả", icon: "apps" },
  Ready: { label: "Ready", icon: "check_circle" },
  "Needs review": { label: "Review", icon: "rate_review" },
  Experimental: { label: "Beta", icon: "science" },
  Archived: { label: "Archive", icon: "inventory" },
};

export type FilterBarVariant = "tools" | "rules";
export type ViewMode = "grid" | "table";

type ToolFilterBarProps = {
  variant?: FilterBarVariant;
  query: string;
  shown: number;
  total: number;
  onQueryChange: (value: string) => void;
  statusFilter?: string;
  onStatusFilterChange?: (value: string) => void;
  pickerTools?: ResolvedTool[];
  selectedId?: string;
  onSelectTool?: (id: string) => void;
  viewMode?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
};

export function ToolFilterBar({
  variant = "tools",
  query,
  shown,
  total,
  onQueryChange,
  statusFilter = "All",
  onStatusFilterChange,
  pickerTools,
  selectedId,
  onSelectTool,
  viewMode,
  onViewModeChange,
}: ToolFilterBarProps) {
  const isRules = variant === "rules";
  const chips = ["All", ...STATUS_ORDER];

  return (
    <div
      className={pickerTools && onSelectTool ? "filter-toolbar has-picker" : "filter-toolbar"}
      role="search"
    >
      <div className="filter-toolbar-row">
        <label className="search-box grow">
          <MaterialIcon name="search" size={18} />
          <input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder={isRules ? "Tìm rule, path..." : "Tìm tool, repo, tag..."}
            type="search"
            aria-label={isRules ? "Tìm rule" : "Tìm tool"}
          />
        </label>
        {!isRules && onStatusFilterChange ? (
          <div className="filter-chips" role="group" aria-label="Lọc trạng thái">
            {chips.map((status) => {
              const meta = CHIP_META[status] ?? { label: status, icon: "label" };
              return (
                <button
                  key={status}
                  className={statusFilter === status ? "chip active" : "chip"}
                  type="button"
                  onClick={() => onStatusFilterChange(status)}
                >
                  <MaterialIcon name={meta.icon} size={15} />
                  {meta.label}
                </button>
              );
            })}
          </div>
        ) : null}
        <span className="filter-meta">
          <MaterialIcon name="filter_alt" size={14} />
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
              <MaterialIcon name="grid_view" size={14} />
              <span>Cards</span>
            </button>
            <button
              type="button"
              className={viewMode === "table" ? "toggle-btn active" : "toggle-btn"}
              onClick={() => onViewModeChange("table")}
              aria-pressed={viewMode === "table"}
              aria-label="Table view"
            >
              <MaterialIcon name="table_rows" size={14} />
              <span>Table</span>
            </button>
          </div>
        ) : null}
      </div>
      {pickerTools && onSelectTool ? (
        <div className="tool-pills" role="listbox" aria-label="Tools">
          {pickerTools.map((tool) => (
            <button
              key={tool.id}
              className={tool.id === selectedId ? "pill active" : "pill"}
              type="button"
              onClick={() => onSelectTool(tool.id)}
              title={tool.repo}
            >
              <span className={`pill-dot ${tool.healthLabel === "Ready" ? "ok" : "warn"}`} />
              {tool.code}
            </button>
          ))}
          {pickerTools.length === 0 ? <span className="filter-meta">Không có tool khớp bộ lọc</span> : null}
        </div>
      ) : null}
    </div>
  );
}
