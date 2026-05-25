import { OVERVIEW_TOC } from "./overview-toc";

export function OverviewTocNav({ code, idPrefix = "" }: { code: string; idPrefix?: string }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-[var(--panel)] p-3">
      <div className="mb-2 flex items-center gap-1.5 px-2 text-[10px] uppercase tracking-wider text-[var(--muted)]">
        <span className="grid h-5 w-5 place-items-center rounded-md border border-indigo-400/30 bg-indigo-500/15 text-[11px] leading-none">
          📖
        </span>
        {code} docs
      </div>
      <nav className="space-y-0.5">
        {OVERVIEW_TOC.map(({ id, label, emoji, chipClass }) => (
          <a
            key={id}
            href={`#${idPrefix}${id}`}
            className="group flex items-center gap-2 rounded-md px-2 py-1.5 text-[12px] text-[var(--muted)] transition-colors hover:bg-white/[.04] hover:text-[var(--text)]"
          >
            <span
              className={`grid h-6 w-6 shrink-0 place-items-center rounded-md border text-[13px] leading-none ${chipClass}`}
              aria-hidden
            >
              {emoji}
            </span>
            <span className="flex-1">{label}</span>
            <span className="text-[10px] opacity-0 transition-opacity group-hover:opacity-40">{emoji}</span>
          </a>
        ))}
      </nav>
    </div>
  );
}
