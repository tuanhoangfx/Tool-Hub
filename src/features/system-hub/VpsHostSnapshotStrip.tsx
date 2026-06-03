import { HardDrive, Server } from "lucide-react";

type VpsInventory = {
  host: string;
  hostname: string;
  provider: string;
  lastSnapshotAt?: string;
  metrics?: {
    ramUsedGi: number;
    ramAvailableGi: number;
    swapGi: number;
    diskUsedPct: number;
    load1: number;
  };
  spec: { cpus: number; ramGb: number; diskGb: number };
  nginxSites: string[];
  localScripts: { label: string; path: string; command: string }[];
};

export function VpsHostSnapshotStrip({ inventory: inv }: { inventory: VpsInventory }) {
  const m = inv.metrics;
  return (
    <section className="mb-4 rounded-2xl border border-amber-500/20 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent">
      <div className="flex flex-wrap items-center gap-3 border-b border-white/5 px-4 py-2.5">
        <Server size={14} className="text-amber-300" />
        <span className="text-sm font-semibold">
          {inv.provider} · {inv.hostname}
        </span>
        <code className="rounded-md bg-black/30 px-1.5 py-0.5 font-mono text-[10px] text-[var(--muted)]">{inv.host}</code>
        {m ? (
          <>
            <span className="text-[10px] text-[var(--muted)]">·</span>
            <span className="inline-flex items-center gap-1 text-[10px] text-[var(--muted)]">
              <HardDrive size={11} />
              RAM {m.ramUsedGi}/{inv.spec.ramGb} GiB · swap {m.swapGi} GiB · disk {m.diskUsedPct}% · load {m.load1}
            </span>
          </>
        ) : null}
        {inv.lastSnapshotAt ? (
          <span className="ml-auto text-[10px] text-[var(--muted)]">
            Snapshot {new Date(inv.lastSnapshotAt).toLocaleString()}
          </span>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-2 px-4 py-2 text-[10px] text-[var(--muted)]">
        <span className="font-medium text-amber-200/90">nginx:</span>
        {inv.nginxSites.map((s) => (
          <span key={s} className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5">
            {s}
          </span>
        ))}
      </div>
    </section>
  );
}
