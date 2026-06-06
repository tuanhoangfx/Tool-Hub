import { useEffect, useState } from "react";
import { ToggleRow } from "@tool-workspace/hub-ui";
import {
  readUserTableColumns,
  USER_TABLE_COLUMN_ITEMS,
  writeUserTableColumns,
  type UserTableColumnKey,
} from "./user-table-prefs";

export function countHiddenUserTableColumns(): number {
  const visible = readUserTableColumns();
  return USER_TABLE_COLUMN_ITEMS.filter((c) => !visible.has(c.key)).length;
}

/** Embedded in unified tab Settings (DisplayPrefs). */
export function UserTableColumnsSettings() {
  const [visible, setVisible] = useState<Set<UserTableColumnKey>>(() => readUserTableColumns());

  useEffect(() => {
    const sync = () => setVisible(readUserTableColumns());
    window.addEventListener("user-table-columns-change", sync);
    return () => window.removeEventListener("user-table-columns-change", sync);
  }, []);

  function toggle(key: UserTableColumnKey) {
    const item = USER_TABLE_COLUMN_ITEMS.find((c) => c.key === key);
    if (item?.required) return;
    const next = new Set(visible);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    writeUserTableColumns(next);
    setVisible(next);
  }

  return (
    <ul className="space-y-0.5">
      {USER_TABLE_COLUMN_ITEMS.map((col) => {
        const on = visible.has(col.key);
        return (
          <li key={col.key} className={col.required ? "opacity-80" : undefined}>
            <div className="flex items-center gap-2">
              <div className={col.required ? "pointer-events-none flex-1" : "flex-1"}>
                <ToggleRow label={col.label} on={on} onChange={() => toggle(col.key)} />
              </div>
              {col.required ? <span className="shrink-0 pr-2 text-[9px] uppercase text-[var(--muted)]">Required</span> : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
