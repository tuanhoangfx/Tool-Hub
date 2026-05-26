import { useEffect, useState, type ReactNode } from "react";
import { LayoutGrid, Minus, Plus, RefreshCcw, Settings2, Upload, User } from "lucide-react";
import { APP_USER_LABEL } from "../../lib/app-meta";
import { readSystemTab, type SystemTab } from "../../features/system-hub/components/SystemTabs";
import { readHubListPrefs } from "../../lib/url-prefs";
import { ToolAvatar } from "../ToolAvatar";
import type { AppScreen } from "../../lib/app-screen";
import { compactIconSize } from "../../lib/ui-scale";
import { toolIconName, toolSvgIcon } from "../../lib/visual";
import { SystemTabSubNav } from "./SystemTabSubNav";

type SidebarProps = {
  screen: AppScreen;
  onNavigate: (screen: AppScreen) => void;
  loadingAll: boolean;
  onLoadRegistry: () => void;
  onRefreshAll: () => void;
  /** Global display prefs, mirrored with per-tab header settings. */
  displayPrefs: ReactNode;
};

const items: { screen: AppScreen; label: string; icon: typeof LayoutGrid }[] = [
  { screen: "library", label: "Hub", icon: LayoutGrid },
  { screen: "system", label: "System", icon: Settings2 },
];

const footerBtn =
  "flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm transition-colors text-[var(--muted)] hover:bg-white/5 hover:text-[var(--text)] disabled:cursor-not-allowed disabled:opacity-60";
const SYSTEM_SUBNAV_OPEN_KEY = "tool-hub:system-subnav-open";

function readSystemSubnavOpen() {
  if (typeof window === "undefined") return true;
  return window.sessionStorage.getItem(SYSTEM_SUBNAV_OPEN_KEY) !== "0";
}

function SidebarFooterButton({
  icon: Icon,
  label,
  iconClass,
  onClick,
  disabled,
  loading,
  title,
  trailing,
}: {
  icon: typeof Upload;
  label: string;
  iconClass: string;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  title?: string;
  trailing?: ReactNode;
}) {
  return (
    <button
      type="button"
      className={footerBtn}
      onClick={onClick}
      disabled={disabled}
      title={title}
    >
      <Icon size={compactIconSize(15)} className={`shrink-0 ${iconClass}`} />
      <span className="flex-1 text-left">{label}</span>
      {trailing}
      {loading ? <RefreshCcw size={compactIconSize(14)} className="anim-spin opacity-80" /> : null}
    </button>
  );
}

export function SalesSidebar({
  screen,
  onNavigate,
  loadingAll,
  onLoadRegistry,
  onRefreshAll,
  displayPrefs,
}: SidebarProps) {
  const [systemTab, setSystemTab] = useState<SystemTab>(() => readSystemTab());
  const [systemSubnavOpen, setSystemSubnavOpen] = useState(readSystemSubnavOpen);
  const [showSubnavToggleIcon, setShowSubnavToggleIcon] = useState(() => readHubListPrefs().navToggleIcon);

  useEffect(() => {
    const sync = () => {
      setSystemTab(readSystemTab());
      setShowSubnavToggleIcon(readHubListPrefs().navToggleIcon);
    };
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);

  useEffect(() => {
    window.sessionStorage.setItem(SYSTEM_SUBNAV_OPEN_KEY, systemSubnavOpen ? "1" : "0");
  }, [systemSubnavOpen]);

  return (
    <aside className="flex h-full min-h-0 w-60 shrink-0 flex-col overflow-visible border-r border-white/5 bg-[var(--panel)] p-4">
      <div className="mb-4 shrink-0 flex items-center gap-3">
        <ToolAvatar
          code="P0004"
          iconName={toolIconName({ code: "P0004" })}
          svgSrc={toolSvgIcon({ code: "P0004" }) ?? undefined}
          size="md"
        />
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold leading-tight">Tool Hub</div>
          <div className="text-[10px] text-[var(--muted)]">Workspace catalog</div>
        </div>
      </div>

      <nav className="min-h-0 flex-1 space-y-0.5 overflow-y-auto">
        {items.map(({ screen: id, label, icon: Icon }) => {
          const active = screen === id;
          const systemSubnavActive = id === "system" && active && systemSubnavOpen;
          const menuActive = active && !systemSubnavActive;
          const ToggleIcon = systemSubnavOpen ? Minus : Plus;
          return (
            <div key={id}>
              <button
                type="button"
                aria-expanded={id === "system" ? systemSubnavOpen : undefined}
                onClick={() => {
                  if (id === "system" && screen === "system") {
                    setSystemSubnavOpen((v) => !v);
                    return;
                  }
                  onNavigate(id);
                  if (id === "system") setSystemSubnavOpen(true);
                }}
                className={`group relative flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-all ${
                  menuActive
                    ? "bg-gradient-to-r from-indigo-500/20 to-purple-500/5 text-indigo-100"
                    : "text-[var(--muted)] hover:bg-white/5 hover:text-[var(--text)]"
                }`}
              >
                {menuActive ? (
                  <span className="absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-r bg-indigo-400" />
                ) : null}
                <Icon size={compactIconSize(16)} className={menuActive ? "text-indigo-300" : ""} />
                <span className="flex-1 text-left">{label}</span>
                {id === "system" && showSubnavToggleIcon ? (
                  <ToggleIcon
                    size={compactIconSize(13)}
                    strokeWidth={2.3}
                    className={`shrink-0 transition-colors ${
                      systemSubnavOpen
                        ? "text-amber-300 group-hover:text-amber-200"
                        : "text-cyan-300 group-hover:text-cyan-200"
                    }`}
                  />
                ) : null}
              </button>
              {id === "system" && systemSubnavOpen ? <SystemTabSubNav activeTab={screen === "system" ? systemTab : null} /> : null}
            </div>
          );
        })}
      </nav>

      <footer className="mt-2 shrink-0 space-y-0.5 overflow-visible border-t border-white/5 pt-2.5">
        <SidebarFooterButton
          icon={User}
          iconClass="text-violet-400"
          label="User"
          title="User management (coming soon)"
          disabled
          trailing={<span className="text-xs font-medium text-[var(--text)]/80">{APP_USER_LABEL}</span>}
        />
        <SidebarFooterButton
          icon={Upload}
          iconClass="text-cyan-400"
          label="Load registry"
          onClick={onLoadRegistry}
          title="Load local registry JSON"
        />
        <SidebarFooterButton
          icon={RefreshCcw}
          iconClass="text-indigo-300"
          label="Refresh"
          onClick={onRefreshAll}
          disabled={loadingAll}
          loading={loadingAll}
          title="Refresh from GitHub"
        />
        {displayPrefs}
      </footer>
    </aside>
  );
}
