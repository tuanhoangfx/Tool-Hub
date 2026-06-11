import { useEffect, useState, type ReactNode } from "react";
import { Gauge, LayoutGrid, RefreshCcw, Settings2, Users } from "lucide-react";
import { HubUserModal } from "../../features/identity/HubUserModal";
import { hubSessionLabels } from "@tool-workspace/hub-identity";
import { useExtensionIdentityRelay } from "../../features/identity/useExtensionIdentityRelay";
import { useHubReturnToRelay } from "../../features/identity/useHubReturnToRelay";
import { useHubAuth } from "../../features/identity/useHubAuth";
import { supabase } from "../../lib/supabase";
import { readSystemTab, type SystemTab } from "../../features/system-hub/components/SystemTabs";
import { readHubListPrefs } from "../../lib/url-prefs";
import { formatHubHeaderDate } from "../../lib/tooling";
import { ToolAvatar } from "../ToolAvatar";
import type { AppScreen } from "../../lib/app-screen";
import { prefetchAppScreen } from "../../lib/app-screen-prefetch";
import { toolIconName, toolSvgIcon } from "../../lib/visual";
import {
  HubLogButton,
  HubSidebarFooterButton,
  HubSidebarNavGroup,
  HubSidebarNavScreenButton,
  HubSidebarShell,
  HubUiZoomControl,
  HubWorkspaceUserShell,
  resolveWorkspaceRoleKey,
  navGroupSubnavOpenKey,
  subscribeHubListPrefs,
  type NavIconTone,
} from "@tool-workspace/hub-ui";
import { SystemTabSubNav } from "./SystemTabSubNav";

type SidebarProps = {
  screen: AppScreen;
  onNavigate: (screen: AppScreen) => void;
  loadingAll: boolean;
  scanningWorkspace: boolean;
  scanStatus: "idle" | "scanning" | "success" | "error";
  scanMessage: string;
  lastScanAt?: string;
  onRefreshAll: () => void;
  /** Global display prefs, mirrored with per-tab header settings. */
  displayPrefs: ReactNode;
};

const NAV_SUBNAV_PREFIX = "tool-hub";

const items: { screen: AppScreen; label: string; icon: typeof LayoutGrid; iconTone: NavIconTone }[] = [
  { screen: "dashboard", label: "Dashboard", icon: Gauge, iconTone: "sky" },
  { screen: "library", label: "Hub", icon: LayoutGrid, iconTone: "indigo" },
  { screen: "users", label: "Users", icon: Users, iconTone: "emerald" },
  { screen: "system", label: "System", icon: Settings2, iconTone: "amber" },
];

function readSystemSubnavOpen() {
  if (typeof window === "undefined") return true;
  return window.sessionStorage.getItem(navGroupSubnavOpenKey(NAV_SUBNAV_PREFIX, "system")) !== "0";
}

export function SalesSidebar({
  screen,
  onNavigate,
  loadingAll,
  scanningWorkspace,
  scanStatus,
  scanMessage,
  lastScanAt,
  onRefreshAll,
  displayPrefs,
}: SidebarProps) {
  const { session } = useHubAuth();
  useExtensionIdentityRelay(session);
  useHubReturnToRelay(session);
  const [systemTab, setSystemTab] = useState<SystemTab>(() => readSystemTab());
  const [systemSubnavOpen, setSystemSubnavOpen] = useState(readSystemSubnavOpen);
  const [showSubnavToggleIcon, setShowSubnavToggleIcon] = useState(() => readHubListPrefs().navToggleIcon);
  const labels = hubSessionLabels(session);

  useEffect(() => {
    const sync = () => setSystemTab(readSystemTab());
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);

  useEffect(() => subscribeHubListPrefs(() => setShowSubnavToggleIcon(readHubListPrefs().navToggleIcon)), []);

  useEffect(() => {
    window.sessionStorage.setItem(
      navGroupSubnavOpenKey(NAV_SUBNAV_PREFIX, "system"),
      systemSubnavOpen ? "1" : "0",
    );
  }, [systemSubnavOpen]);

  const scanIndicator = buildScanIndicator(scanStatus, scanMessage, lastScanAt);

  return (
    <HubSidebarShell
      brandLeading={
        <ToolAvatar
          code="P0004"
          iconName={toolIconName({ code: "P0004" })}
          svgSrc={toolSvgIcon({ code: "P0004" }) ?? undefined}
          size="md"
        />
      }
      brandTitle="Tool Hub"
      brandTagline="Workspace catalog"
      nav={
        <>
          {items.map(({ screen: id, label, icon: Icon, iconTone }) => {
            if (id === "system") {
              const systemActive = screen === "system";
              return (
                <HubSidebarNavGroup
                  key={id}
                  label={label}
                  icon={Icon}
                  iconTone={iconTone}
                  active={systemActive}
                  subnavOpen={systemSubnavOpen}
                  showToggleIcon={showSubnavToggleIcon}
                  onMouseEnter={() => prefetchAppScreen(id)}
                  onFocus={() => prefetchAppScreen(id)}
                  onClick={() => {
                    if (systemActive) {
                      setSystemSubnavOpen((v) => !v);
                      return;
                    }
                    onNavigate(id);
                    setSystemSubnavOpen(true);
                  }}
                  subnav={<SystemTabSubNav activeTab={systemActive ? systemTab : null} />}
                />
              );
            }

            return (
              <HubSidebarNavScreenButton
                key={id}
                label={label}
                icon={Icon}
                iconTone={iconTone}
                active={screen === id}
                onClick={() => onNavigate(id)}
                onMouseEnter={() => prefetchAppScreen(id)}
                onFocus={() => prefetchAppScreen(id)}
              />
            );
          })}
        </>
      }
      footer={
        <>
          <HubWorkspaceUserShell
            session={session}
            labels={labels}
            roleKey={resolveWorkspaceRoleKey(session, session ? "user" : "anonymous")}
            profileRoleClient={supabase}
            profileRoleUserId={session?.user?.id}
            profileRoleEmail={session?.user?.email}
            footerGuestLabel="Sign in"
            renderModal={({ open, onClose }) => (
              <HubUserModal open={open} onClose={onClose} session={session} />
            )}
          />
          <HubSidebarFooterButton
            icon={RefreshCcw}
            iconClass="text-emerald-300"
            label="Refresh"
            onClick={onRefreshAll}
            disabled={scanningWorkspace || loadingAll}
            loading={scanningWorkspace || loadingAll}
            trailing={scanIndicator}
            title={scanMessage || "Scan local workspace, check GitHub dry-run, then refresh metadata"}
          />
          <HubLogButton variant="global" />
          {displayPrefs}
          <HubUiZoomControl />
        </>
      }
    />
  );
}

function buildScanIndicator(status: "idle" | "scanning" | "success" | "error", message: string, lastScanAt?: string) {
  if (status === "scanning") {
    return null;
  }

  if (status === "success") {
    const { className, dateLabel, title } = scanFreshness(lastScanAt);
    return <ScanFreshnessDot className={className} dateLabel={dateLabel} title={message || title} />;
  }

  if (status === "error") {
    return (
      <ScanFreshnessDot className="bg-rose-400" dateLabel={formatShortDate(lastScanAt)} title={message || "Workspace refresh failed"} />
    );
  }

  const { className, dateLabel, title } = scanFreshness(lastScanAt);
  return <ScanFreshnessDot className={className} dateLabel={dateLabel} title={title} />;
}

function ScanFreshnessDot({ className, dateLabel, title }: { className: string; dateLabel?: string; title: string }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1" title={title} aria-label={title}>
      <span className={`h-2.5 w-2.5 rounded-full ${className}`} />
      {dateLabel ? <span className="text-[10px] font-medium tabular-nums text-[var(--muted)]">{dateLabel}</span> : null}
    </span>
  );
}

function scanFreshness(lastScanAt?: string) {
  if (!lastScanAt) {
    return {
      className: "bg-white/20",
      dateLabel: undefined,
      title: "No workspace scan loaded yet",
    };
  }

  const scannedAt = new Date(lastScanAt).getTime();
  if (Number.isNaN(scannedAt)) {
    return {
      className: "bg-white/20",
      dateLabel: undefined,
      title: "Workspace scan time is invalid",
    };
  }

  const ageMs = Date.now() - scannedAt;
  const hours = ageMs / (60 * 60 * 1000);
  const days = hours / 24;
  const scannedLabel = new Date(scannedAt).toLocaleString("vi-VN");
  const dateLabel = formatShortDate(lastScanAt);

  if (hours < 12) {
    return {
      className: "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.65)]",
      dateLabel,
      title: `Last workspace scan: ${scannedLabel} (<12h)`,
    };
  }

  if (days <= 7) {
    return {
      className: "bg-amber-300 shadow-[0_0_8px_rgba(252,211,77,0.55)]",
      dateLabel,
      title: `Last workspace scan: ${scannedLabel} (${days <= 3 ? "12h-3d" : "3d-7d"})`,
    };
  }

  return {
    className: "bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.55)]",
    dateLabel,
    title: `Last workspace scan: ${scannedLabel} (>7d)`,
  };
}

function formatShortDate(value?: string) {
  const label = formatHubHeaderDate(value);
  return label === "—" ? undefined : label;
}
