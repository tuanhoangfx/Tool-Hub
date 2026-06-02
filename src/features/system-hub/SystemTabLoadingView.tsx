import { HubLoadingView, HUB_LOADING_PRESETS } from "../../components/sales-shell/HubLoadingView";
import type { SystemTab } from "./components/SystemTabs";

const TAB_PRESET: Record<SystemTab, keyof typeof HUB_LOADING_PRESETS> = {
  overview: "overview",
  schema: "schema",
  "supabase-quota": "supabaseQuota",
  agent: "agent",
  template: "template",
};

export type SystemTabLoadingViewProps = {
  tab: SystemTab;
  variant?: "full" | "overlay" | "skeleton";
};

export function SystemTabLoadingView({ tab, variant = "full" }: SystemTabLoadingViewProps) {
  const preset = HUB_LOADING_PRESETS[TAB_PRESET[tab]];
  return <HubLoadingView icon={preset.icon} ariaLabel={preset.ariaLabel} variant={variant} />;
}
