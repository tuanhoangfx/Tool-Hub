import { setSystemTab, SYSTEM_TAB_ITEMS, type SystemTab } from "../../features/system-hub/components/SystemTabs";

export function SystemTabSubNav({ activeTab }: { activeTab: SystemTab }) {
  return (
    <div className="system-tab-subnav relative ml-3 mt-1.5 space-y-0.5 pl-4 before:absolute before:bottom-2 before:left-1 before:top-2 before:w-px before:bg-gradient-to-b before:from-transparent before:via-indigo-300/25 before:to-transparent">
      {SYSTEM_TAB_ITEMS.map(({ id, label, icon: Icon }) => {
        const isActive = activeTab === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => setSystemTab(id)}
            className={`group relative flex h-9 w-full items-center gap-2.5 rounded-xl px-3 text-left text-sm transition-all ${
              isActive
                ? "bg-gradient-to-r from-indigo-500/20 to-purple-500/5 text-indigo-100"
                : "text-[var(--muted)] hover:bg-white/[.04] hover:text-[var(--text)]"
            }`}
          >
            <span
              className={`absolute -left-[1.05rem] top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full transition-all ${
                isActive ? "bg-rose-400 shadow-[0_0_12px_rgba(251,113,133,0.95)]" : "bg-white/15 group-hover:bg-indigo-300/60"
              }`}
              aria-hidden
            />
            <Icon size={15} className={isActive ? "text-indigo-300" : ""} />
            <span className="min-w-0 flex-1 truncate text-left">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
