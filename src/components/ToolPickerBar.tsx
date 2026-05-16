import type { ResolvedTool } from "../types";
import { MaterialIcon } from "./MaterialIcon";

type ToolPickerBarProps = {
  tools: ResolvedTool[];
  selectedId: string;
  query: string;
  onQueryChange: (value: string) => void;
  onSelect: (id: string) => void;
};

export function ToolPickerBar({ tools, selectedId, query, onQueryChange, onSelect }: ToolPickerBarProps) {
  return (
    <div className="filter-toolbar tool-picker">
      <label className="search-box grow">
        <MaterialIcon name="search" size={16} />
        <input value={query} onChange={(e) => onQueryChange(e.target.value)} placeholder="Chon tool..." type="search" aria-label="Tim tool" />
      </label>
      <div className="tool-pills" role="listbox" aria-label="Tools">
        {tools.map((tool) => (
          <button
            key={tool.id}
            className={tool.id === selectedId ? "pill active" : "pill"}
            type="button"
            onClick={() => onSelect(tool.id)}
            title={tool.repo}
          >
            <span className={`pill-dot ${tool.healthLabel === "Ready" ? "ok" : "warn"}`} />
            {tool.code}
          </button>
        ))}
        {tools.length === 0 ? <span className="filter-meta">Khong co tool</span> : null}
      </div>
    </div>
  );
}
