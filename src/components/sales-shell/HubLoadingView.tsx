import type { LucideIcon } from "lucide-react";
import { Bot, Cloud, Database, Gauge, LayoutGrid, Palette, Server, Settings2, Users } from "lucide-react";
import {
  HubLoadingView as HubLoadingViewBase,
  HubScreenChunkFallback,
  type HubLoadingViewProps,
} from "@tool-workspace/hub-ui";
import type { AppScreen } from "../../lib/app-screen";

export type { HubLoadingViewProps };

export function HubLoadingView(props: HubLoadingViewProps) {
  return <HubLoadingViewBase {...props} />;
}

export function UsersLoadingView({ variant = "full" }: Pick<HubLoadingViewProps, "variant">) {
  return <HubLoadingView icon={Users} ariaLabel="Loading users" variant={variant} />;
}

/** Presets for System sub-tabs (tab icon + aria label). */
export const HUB_LOADING_PRESETS = {
  overview: { icon: LayoutGrid, ariaLabel: "Loading overview" },
  schema: { icon: Database, ariaLabel: "Loading schema" },
  supabaseQuota: { icon: Cloud, ariaLabel: "Loading Supabase quota" },
  server: { icon: Server, ariaLabel: "Loading server inventory" },
  agent: { icon: Bot, ariaLabel: "Loading agent context" },
  template: { icon: Palette, ariaLabel: "Loading design template" },
} as const satisfies Record<string, { icon: LucideIcon; ariaLabel: string }>;

export const APP_LOADING_PRESETS = {
  dashboard: { icon: Gauge, ariaLabel: "Loading dashboard" },
  library: { icon: LayoutGrid, ariaLabel: "Loading hub" },
  users: { icon: Users, ariaLabel: "Loading users" },
  system: { icon: Settings2, ariaLabel: "Loading system" },
} as const satisfies Record<AppScreen, { icon: LucideIcon; ariaLabel: string }>;

export function AppScreenLoadingView({ screen }: { screen: AppScreen }) {
  const preset = APP_LOADING_PRESETS[screen];
  return <HubScreenChunkFallback icon={preset.icon} ariaLabel={preset.ariaLabel} />;
}
