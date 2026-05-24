import { MaterialIcon } from "../../../components";

export type SystemTab = "overview" | "template";

const tabs: { id: SystemTab; label: string; icon: string }[] = [
  { id: "overview", label: "Overview", icon: "dashboard" },
  { id: "template", label: "Design Template", icon: "palette" },
];

export function readSystemTab(): SystemTab {
  if (typeof window === "undefined") return "template";
  const t = new URLSearchParams(window.location.search).get("stab");
  if (t === "overview") return "overview";
  return "template";
}

export function SystemTabs({ tab, onTab }: { tab: SystemTab; onTab: (t: SystemTab) => void }) {
  return (
    <nav className="system-tabs">
      {tabs.map(({ id, label, icon }) => {
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
              window.history.replaceState(null, "", `${window.location.pathname}?${p.toString()}`);
            }}
            className={active ? "system-tab active" : "system-tab"}
          >
            <MaterialIcon name={icon} size={14} />
            {label}
          </button>
        );
      })}
    </nav>
  );
}
