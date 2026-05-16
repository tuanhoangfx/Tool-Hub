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
}: ToolFilterBarProps) {
  const isRules = variant === "rules";
  const chips = ["All", ...STATUS_ORDER];
  const hasPicker = Boolean(pickerTools?.length || (pickerTools && onSelectTool));

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
