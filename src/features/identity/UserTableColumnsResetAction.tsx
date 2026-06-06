import { RotateCcw } from "lucide-react";
import { resetUserTableColumns } from "./user-table-prefs";

/** Table columns section header action — Settings modal title row. */
export function UserTableColumnsResetAction() {
  return (
    <button
      type="button"
      onClick={() => resetUserTableColumns()}
      className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] text-[var(--muted)] hover:bg-white/5 hover:text-[var(--text)]"
    >
      <RotateCcw size={10} aria-hidden />
      Reset columns
    </button>
  );
}
