import { createPortal } from "react-dom";
import { Gauge, type LucideIcon } from "lucide-react";
import { compactIconSize } from "../ui-scale";
import { ensureHubTabLoaderRoot, HUB_TAB_LOADER_ROOT_ID } from "./HubLoaderRoot";

export type HubLoadingViewProps = {
  icon: LucideIcon;
  ariaLabel: string;
  variant?: "full" | "overlay";
};

function HubLoaderOrb({ Icon }: { Icon: LucideIcon }) {
  const iconSize = compactIconSize(20);
  const gaugeSize = compactIconSize(14);
  return (
    <div className="hub-loader-orb" aria-hidden>
      <span className="hub-loader-orb__ring" />
      <span className="hub-loader-orb__ring hub-loader-orb__ring--dash" />
      <span className="hub-loader-orb__ring hub-loader-orb__ring--inner" />
      <span className="hub-loader-orb__glow" />
      <span className="hub-loader-orb__icon-box">
        <Icon size={iconSize} className="text-indigo-300" strokeWidth={1.75} />
      </span>
      <Gauge size={gaugeSize} className="hub-loader-orb__gauge" strokeWidth={2} aria-hidden />
    </div>
  );
}

export function HubLoadingView({ icon: Icon, ariaLabel, variant = "full" }: HubLoadingViewProps) {
  const node = (
    <div
      className={`hub-tab-loader-fill${variant === "overlay" ? " hub-tab-loader-fill--dim" : ""}`}
      role="status"
      aria-label={ariaLabel}
      aria-live="polite"
    >
      <HubLoaderOrb Icon={Icon} />
    </div>
  );
  const root =
    typeof document !== "undefined"
      ? (document.getElementById(HUB_TAB_LOADER_ROOT_ID) ?? ensureHubTabLoaderRoot())
      : null;
  if (root) return createPortal(node, root);
  return node;
}
