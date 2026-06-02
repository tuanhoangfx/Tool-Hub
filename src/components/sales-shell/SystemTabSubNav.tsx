import { setSystemTab, SYSTEM_TAB_ITEMS, type SystemTab } from "../../features/system-hub/components/SystemTabs";
import { prefetchSystemTab } from "../../features/system-hub/system-tab-prefetch";
import { compactIconSize } from "../../lib/ui-scale";

export function SystemTabSubNav({ activeTab }: { activeTab: SystemTab | null }) {
  return (
    <div className="system-tab-subnav ml-3 mt-1.5 space-y-0.5">
      {SYSTEM_TAB_ITEMS.map(({ id, label, icon: Icon }) => {
        const isActive = activeTab === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => setSystemTab(id)}
            onMouseEnter={() => prefetchSystemTab(id)}
            onFocus={() => prefetchSystemTab(id)}
            className="group grid h-8 w-full grid-cols-[1.25rem_minmax(0,1fr)] items-center text-left text-[13px]"
          >
            <span className="relative flex h-full items-center justify-center" aria-hidden>
              <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-indigo-300/25 to-transparent" />
              <span
                className={`relative h-1.5 w-1.5 rounded-full transition-all ${
                  isActive ? "bg-rose-400 shadow-[0_0_12px_rgba(251,113,133,0.9)]" : "bg-white/15 group-hover:bg-indigo-300/60"
                }`}
              />
            </span>
            <span
              className={`flex h-8 min-w-0 items-center gap-2 rounded-xl px-3 transition-colors ${
                isActive
                  ? "bg-gradient-to-r from-indigo-500/20 to-purple-500/5 text-indigo-100"
                  : "text-[var(--muted)] group-hover:bg-white/[.04] group-hover:text-[var(--text)]"
              }`}
            >
              <Icon size={compactIconSize(14)} className={isActive ? "text-indigo-300" : ""} />
              <span className="min-w-0 flex-1 truncate text-left">{label}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
