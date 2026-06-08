import { Gauge, LayoutGrid, Users, type LucideIcon } from "lucide-react";
import {
  HUB_APP_TAB_GROUP_META,
  HUB_UI_TEMPLATE_META,
  type HubAppTabGroup,
  type HubUiTemplate,
} from "@tool-workspace/hub-ui";
import { SYSTEM_TAB_ITEMS, type SystemTab } from "../system-hub/components/SystemTabs";
import type { AppScreen } from "../../lib/app-screen";
import { buildAppUrl, buildSystemUrl } from "../../lib/hub-path";
import type { ResolvedTool } from "../../types";
import { catalogGoldenRef, catalogTemplate, p0004CatalogByScreen } from "./dashboard-catalog-source";
import type { DashboardScreenStatus } from "./dashboard-screen-status";

export type DashboardTabGroup = "hub" | "users" | "system";

export type DashboardTabEntry = {
  id: string;
  label: string;
  group: DashboardTabGroup;
  groupLabel: string;
  path: string;
  description: string;
  template: string;
  icon: LucideIcon;
  screen: AppScreen;
  systemTab?: SystemTab;
  meta?: string;
  goldenRef?: string;
  goldenScreenPath?: string;
  status?: DashboardScreenStatus;
};

const GROUP_LABELS: Record<DashboardTabGroup, string> = {
  hub: HUB_APP_TAB_GROUP_META.hub.label,
  users: HUB_APP_TAB_GROUP_META.users.label,
  system: HUB_APP_TAB_GROUP_META.system.label,
};

const CATALOG = p0004CatalogByScreen();

const TOP_LEVEL: Omit<DashboardTabEntry, "path" | "meta" | "goldenRef" | "goldenScreenPath">[] = [
  {
    id: "dashboard-home",
    label: "Dashboard",
    group: "hub",
    groupLabel: GROUP_LABELS.hub,
    description: "Workspace screen console — KPI, charts, and catalog of P0004 tabs.",
    template: catalogTemplate("dashboard") ?? "dashboard",
    icon: Gauge,
    screen: "dashboard",
  },
  {
    id: "hub-catalog",
    label: "Hub",
    group: "hub",
    groupLabel: GROUP_LABELS.hub,
    description: "Workspace tool catalog with GitHub health, drift alerts, and local registry.",
    template: catalogTemplate("hub") ?? "directory",
    icon: LayoutGrid,
    screen: "library",
  },
  {
    id: "users-directory",
    label: "Users",
    group: "users",
    groupLabel: GROUP_LABELS.users,
    description: "Hub identity directory — roles, access, and Supabase-backed user management.",
    template: catalogTemplate("users") ?? "directory",
    icon: Users,
    screen: "users",
  },
];

const SYSTEM_TAB_META: Partial<Record<SystemTab, { description: string; catalogScreen: string }>> = {
  overview: {
    description: "Tool Hub release roadmap, manifest summary, and production readiness signals.",
    catalogScreen: "overview",
  },
  schema: {
    description: "Catalog, manifest, and runtime schema explorers for workspace metadata.",
    catalogScreen: "system",
  },
  "supabase-quota": {
    description: "Supabase project quota usage, billing signals, and workspace database health.",
    catalogScreen: "system",
  },
  server: {
    description: "Local dev server status, workspace ports, and stack launcher controls.",
    catalogScreen: "system",
  },
  agent: {
    description: "Agent manifest, Cursor rules/skills registry, and automation context sync.",
    catalogScreen: "system",
  },
  template: {
    description: "Design Template gate — compare V1–V5 mockups before locking production UI.",
    catalogScreen: "system",
  },
};

function catalogFields(screenKey: string) {
  const row = CATALOG.get(screenKey);
  return {
    template: row?.template,
    goldenRef: row?.golden,
    goldenScreenPath: row?.goldenScreenPath,
  };
}

function systemTabPath(tab: SystemTab): string {
  return buildSystemUrl({ tab }, "");
}

/** Canonical scan of P0004 tabs from ui-screens.catalog + System sub-tabs. */
export function buildDashboardTabRegistry(opts?: {
  tools?: ResolvedTool[];
  registryLive?: boolean;
  registryLabel?: string;
}): DashboardTabEntry[] {
  const toolCount = opts?.tools?.length ?? 0;
  const registryMeta =
    opts?.registryLive && opts.registryLabel
      ? `Registry ${opts.registryLabel}`
      : opts?.registryLive
        ? "Registry live"
        : "Registry pending";

  const top: DashboardTabEntry[] = TOP_LEVEL.map((entry) => {
    const screenKey =
      entry.id === "dashboard-home"
        ? "dashboard"
        : entry.id === "hub-catalog"
          ? "hub"
          : "users";
    const cat = catalogFields(screenKey);
    return {
      ...entry,
      template: cat.template ?? entry.template,
      goldenRef: cat.goldenRef,
      goldenScreenPath: cat.goldenScreenPath,
      path:
        entry.screen === "dashboard"
          ? buildAppUrl("dashboard")
          : entry.screen === "library"
            ? buildAppUrl("library")
            : buildAppUrl(entry.screen),
      meta:
        entry.id === "hub-catalog"
          ? `${toolCount} tools · ${registryMeta}`
          : entry.id === "users-directory"
            ? "Identity · Supabase"
            : entry.id === "dashboard-home"
              ? "Screen console · P0004"
              : undefined,
    };
  });

  const system: DashboardTabEntry[] = SYSTEM_TAB_ITEMS.map(({ id, label, icon }) => {
    const meta = SYSTEM_TAB_META[id];
    const cat = catalogFields(meta?.catalogScreen ?? "system");
    const template =
      (meta?.catalogScreen === "overview" ? catalogTemplate("overview") : undefined) ??
      cat.template ??
      "system-panels";
    return {
      id: `system-${id}`,
      label,
      group: "system",
      groupLabel: GROUP_LABELS.system,
      path: systemTabPath(id),
      description: meta?.description ?? `System panel — ${label}.`,
      template,
      icon,
      screen: "system",
      systemTab: id,
      goldenRef: id === "overview" ? catalogGoldenRef("overview") : cat.goldenRef,
      goldenScreenPath: id === "overview" ? CATALOG.get("overview")?.goldenScreenPath : cat.goldenScreenPath,
      meta: "System sub-tab",
    };
  });

  return [...top, ...system];
}

export const DASHBOARD_GROUP_OPTIONS = (
  Object.keys(HUB_APP_TAB_GROUP_META) as HubAppTabGroup[]
).map((value) => ({
  value,
  label: HUB_APP_TAB_GROUP_META[value].label,
}));

export const DASHBOARD_TEMPLATE_OPTIONS = (
  ["directory", "document-toc", "system-panels", "dashboard"] as HubUiTemplate[]
).map((value) => ({
  value,
  label: HUB_UI_TEMPLATE_META[value].label,
}));
