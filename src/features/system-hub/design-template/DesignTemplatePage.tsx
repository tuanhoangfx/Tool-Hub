import { useMemo } from "react";
import { Archive, Bot, Eye, FileStack, Layers, LayoutGrid, Lock, Sparkles } from "lucide-react";
import type { KpiTileData } from "../../../components/sales-shell";
import { HubDesignTemplateEmpty } from "@tool-workspace/hub-ui";
import { SystemHubShell } from "../SystemHubShell";

/** Design previews removed after Agent context locked to V2 (System → Agent tab). */
export function DesignTemplatePage() {
  const kpiItems = useMemo<KpiTileData[]>(
    () => [
      { prefKey: "total", label: "Templates", value: 0, icon: LayoutGrid, tone: "indigo" },
      { prefKey: "locked", label: "Locked", value: 0, icon: Lock, tone: "amber" },
      { prefKey: "preview", label: "In preview", value: 0, icon: Eye, tone: "purple" },
      { prefKey: "draft", label: "Draft", value: 0, icon: FileStack, tone: "purple" },
      { prefKey: "published", label: "Published", value: 0, icon: Sparkles, tone: "emerald" },
      { prefKey: "variants", label: "Variants", value: 0, icon: Layers, tone: "indigo" },
      { prefKey: "features", label: "Features", value: 0, icon: Bot, tone: "blue" },
      { prefKey: "archived", label: "Archived", value: 0, icon: Archive, tone: "rose" },
    ],
    [],
  );

  return (
    <SystemHubShell tabId="template" showFilter={false} sectionRuleLabel="Design Template" kpiItems={kpiItems}>
      <HubDesignTemplateEmpty />
    </SystemHubShell>
  );
}
