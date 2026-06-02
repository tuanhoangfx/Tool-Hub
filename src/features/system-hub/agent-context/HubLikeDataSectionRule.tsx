/** Accent divider before data section — mirror HubListPage / Supabase quota. */
export function HubLikeDataSectionRule({ label }: { label: string }) {
  return (
    <div role="separator" className="relative py-5" aria-label={label}>
      <div
        className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-indigo-400/45 to-transparent shadow-[0_0_10px_rgba(99,102,241,0.2)]"
        aria-hidden
      />
      <div className="relative flex justify-center" aria-hidden>
        <span className="inline-flex items-center gap-2 rounded-full border border-indigo-500/25 bg-[var(--bg)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-indigo-300/90 shadow-[0_0_16px_rgba(99,102,241,0.12)]">
          <span className="h-1 w-1 shrink-0 rounded-full bg-indigo-400" />
          {label}
          <span className="h-1 w-1 shrink-0 rounded-full bg-indigo-400" />
        </span>
      </div>
    </div>
  );
}
