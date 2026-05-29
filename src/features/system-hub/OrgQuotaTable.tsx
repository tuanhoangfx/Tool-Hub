import type { OrgRow } from "./SystemSupabaseQuotaPanel.types";
import { orgQuotaRows, toMb } from "./supabase-quota-metrics";

function fmtCell(v: number | null, fmt: (n: number) => string) {
  return v == null ? "—" : fmt(v);
}

type OrgQuotaTableProps = {
  organizations: OrgRow[];
};

export function OrgQuotaTable({ organizations }: OrgQuotaTableProps) {
  const rows = orgQuotaRows(organizations);
  if (rows.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-2xl border border-white/5 bg-[var(--panel)]">
      <div className="border-b border-white/5 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
        Quota by org
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-[12px]">
          <thead>
            <tr className="border-b border-white/5 bg-white/[.02] text-[10px] uppercase tracking-wider text-[var(--muted)]">
              <th className="px-3 py-2 font-medium">Organization</th>
              <th className="px-3 py-2 font-medium">Plan</th>
              <th className="px-3 py-2 font-medium">Max file</th>
              <th className="px-3 py-2 font-medium">Log retention</th>
              <th className="px-3 py-2 font-medium">Functions max</th>
              <th className="px-3 py-2 font-medium">Realtime users</th>
              <th className="px-3 py-2 font-medium">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {rows.map((row) => {
              const org = organizations.find((o) => o.slug === row.slug);
              return (
                <tr key={row.slug} className="hover:bg-white/[.02]">
                  <td className="px-3 py-2 font-mono text-[11px] text-indigo-200/90">{row.slug}</td>
                  <td className="px-3 py-2 text-[var(--text)]">{row.plan ?? "—"}</td>
                  <td className="px-3 py-2 font-mono text-[11px]">{fmtCell(row.maxFileBytes, (n) => `${toMb(n)} MB`)}</td>
                  <td className="px-3 py-2 font-mono text-[11px]">
                    {fmtCell(row.logDays, (n) => `${n} day${n === 1 ? "" : "s"}`)}
                  </td>
                  <td className="px-3 py-2 font-mono text-[11px]">{fmtCell(row.fnMax, String)}</td>
                  <td className="px-3 py-2 font-mono text-[11px]">{fmtCell(row.rtUsers, String)}</td>
                  <td className="px-3 py-2 text-[11px] text-rose-200">{org?.error ?? "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
