import { STATUS_ORDER } from "../lib/tooling";
import { MaterialIcon } from "./MaterialIcon";

const CHIP_META: Record<string, { label: string; icon: string }> = {
  All: { label: "Tất cả", icon: "apps" },
  Ready: { label: "Ready", icon: "check_circle" },
  "Needs review": { label: "Review", icon: "rate_review" },
  Experimental: { label: "Beta", icon: "science" },
  Archived: { label: "Archive", icon: "inventory" },
};

type ToolFilterBarProps = {
  query: string;
  statusFilter: string;
  shown: number;
  total: number;
  onQueryChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
};

export function ToolFilterBar({ query, statusFilter, shown, total, onQueryChange, onStatusFilterChange }: ToolFilterBarProps) {
  const chips = ["All", ...STATUS_ORDER];

  return (
    <div className="filter-toolbar" role="search">
      <label className="search-box">
        <MaterialIcon name="search" size={18} />
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Tìm tool, repo, tag..."
          type="search"
          aria-label="Tìm tool"
        />
      </label>
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
      <span className="filter-meta">
        <MaterialIcon name="filter_alt" size={14} />
        {shown}/{total}
      </span>
    </div>
  );
}
