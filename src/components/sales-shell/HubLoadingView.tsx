import type { LucideIcon } from "lucide-react";
import { Bot, Cloud, Database, Gauge, LayoutGrid, Palette, Server, Users } from "lucide-react";
import { HubLoadingView as HubLoadingViewBase, type HubLoadingViewProps } from "@tool-workspace/hub-ui";

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
