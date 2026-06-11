import { LayoutGrid } from "lucide-react";
import {
  HUB_APP_TAB_GROUP_META,
  HUB_UI_TEMPLATE_META,
  navKpiTone,
  type HubAppTabGroup,
  type HubUiTemplate,
} from "@tool-workspace/hub-ui";
import type { KpiTileData } from "../../components/sales-shell";
import type { DashboardKpis } from "./dashboard-aggregates";

const TEMPLATE_KPI_KEYS = ["directory", "system-panels", "document-toc"] as const;

export function buildDashboardKpiItems(kpis: DashboardKpis): KpiTileData[] {
  const groupItems: KpiTileData[] = (Object.keys(HUB_APP_TAB_GROUP_META) as HubAppTabGroup[]).map(
    (group) => {
      const meta = HUB_APP_TAB_GROUP_META[group];
      const value = group === "hub" ? kpis.hub : group === "users" ? kpis.users : kpis.system;
      return {
        label: `${meta.label} group`,
        value,
        icon: meta.icon,
        prefKey: group,
        tone: navKpiTone(meta.iconTone),
      };
    },
  );

  const templateItems: KpiTileData[] = TEMPLATE_KPI_KEYS.map((template) => {
    const meta = HUB_UI_TEMPLATE_META[template as HubUiTemplate];
    const value =
      template === "directory"
        ? kpis.directory
        : template === "system-panels"
          ? kpis.systemPanels
          : kpis.documentToc;
    return {
      label: meta.label,
      value,
      icon: meta.icon,
      prefKey: template === "system-panels" ? "system_panels" : template.replace("-", "_"),
      tone: navKpiTone(meta.iconTone),
    };
  });

  return [
    {
      label: "Screens shown",
      value: kpis.total,
      icon: LayoutGrid,
      prefKey: "total",
      tone: navKpiTone(HUB_UI_TEMPLATE_META.dashboard.iconTone),
    },
    ...groupItems,
    ...templateItems,
  ];
}
