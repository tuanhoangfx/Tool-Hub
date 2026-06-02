import { Palette } from "lucide-react";

export function DesignTemplateEmpty() {
  return (
    <div className="flex min-h-[min(420px,50vh)] flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-[var(--panel)]/40 px-6 py-16 text-center">
      <Palette size={40} className="text-indigo-300/50" aria-hidden />
      <h3 className="mt-4 text-lg font-semibold text-[var(--text)]">No active designs</h3>
      <p className="mt-2 max-w-md text-sm text-[var(--muted)]">
        Mockups appear here only while you are reviewing. After you lock a variant (
        <span className="font-mono text-indigo-200/90">Design: V1</span> …{" "}
        <span className="font-mono text-indigo-200/90">V5</span>), preview code and mock data are removed from this tab.
      </p>
      <p className="mt-3 text-xs text-[var(--muted)]">
        Ask the agent to scaffold a new review when you need another feature designed.
      </p>
    </div>
  );
}
