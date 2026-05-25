import { Database, LayoutGrid, Palette } from "lucide-react";

export type SystemTab = "overview" | "schema" | "template";

const tabs: { id: SystemTab; label: string; icon: typeof LayoutGrid }[] = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "schema", label: "Schema", icon: Database },
  { id: "template", label: "Design Template", icon: Palette },
];

export function readSystemTab(): SystemTab {
  if (typeof window === "undefined") return "overview";
  const t = new URLSearchParams(window.location.search).get("stab");
  if (t === "schema") return "schema";
  if (t === "template") return "template";
  return "overview";
}

export function SystemTabs({ tab, onTab }: { tab: SystemTab; onTab: (t: SystemTab) => void }) {
  return (
    <nav className="inline-flex rounded-lg border border-white/10 bg-[var(--panel)] p-0.5">
      {tabs.map(({ id, label, icon: Icon }) => {
        const active = tab === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => {
              onTab(id);
              const p = new URLSearchParams(window.location.search);
              p.set("screen", "system");
              p.set("stab", id);
              if (id === "schema" && !p.get("table")) p.set("table", "catalog");
              window.history.replaceState(null, "", `${window.location.pathname}?${p.toString()}`);
            }}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors ${
              active ? "bg-indigo-500/20 text-indigo-200" : "text-[var(--muted)] hover:text-[var(--text)]"
            }`}
          >
            <Icon size={14} /> {label}
          </button>
        );
      })}
    </nav>
  );
}
