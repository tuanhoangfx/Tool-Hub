import type { ReactNode } from "react";

export type HubTableColumn = { key: string; label: string; className?: string };

export function HubDataTable({
  columns,
  children,
  empty,
}: {
  columns: HubTableColumn[];
  children: ReactNode;
  empty?: ReactNode;
}) {
  return (
    <div className="hub-users-table-wrap overflow-hidden rounded-xl border border-white/5">
      <table className="hub-users-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} className={col.className}>
                <span className="hub-users-th-text">{col.label}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {empty ?? null}
          {children}
        </tbody>
      </table>
    </div>
  );
}

export function HubTableEmptyRow({ colSpan, children }: { colSpan: number; children: ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className="py-10 text-center text-[var(--muted)]">
        {children}
      </td>
    </tr>
  );
}
