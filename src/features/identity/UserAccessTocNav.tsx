import { USER_ACCESS_TOC } from "./user-access-toc";

export function UserAccessTocNav({ idPrefix = "" }: { idPrefix?: string }) {
  return (
    <div className="overview-toc-nav h-[var(--overview-toc-h)] w-[var(--overview-toc-w)] shrink-0 overflow-hidden rounded-2xl border border-indigo-300/10 bg-[var(--panel)] p-2 shadow-[0_14px_36px_rgba(0,0,0,0.16)] ring-1 ring-white/[.025]">
      <nav className="space-y-0.5">
        {USER_ACCESS_TOC.map(({ id, label, emoji, chipClass }) => (
          <a
            key={id}
            href={`#${idPrefix}${id}`}
            className="group flex h-[var(--overview-toc-row-h)] w-full items-center gap-2 rounded-lg border border-transparent px-2 text-[13px] text-[var(--muted)] transition-colors hover:border-indigo-300/10 hover:bg-indigo-500/[.08] hover:text-[var(--text)]"
          >
            <span
              className={`grid h-6 w-6 shrink-0 place-items-center rounded-md border text-[12px] leading-none opacity-90 transition-opacity group-hover:opacity-100 ${chipClass}`}
              aria-hidden
            >
              {emoji}
            </span>
            <span className="min-w-0 flex-1 truncate font-medium">{label}</span>
          </a>
        ))}
      </nav>
    </div>
  );
}
