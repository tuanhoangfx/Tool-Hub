import type { DesignFeatureId } from "../../../lib/design-template-state";

export const USER_MODAL_SHELL_LOCK = "V5" as const;
export const USER_MODAL_LABEL_LOCK = "L1" as const;

export type ActiveDesignFeature = {
  id: DesignFeatureId;
  title: string;
  subtitle: string;
  template: "tool-access" | "agent-context" | "auth-gate";
  lockedVariant?: string;
};

/** User modal V5+L1 shipped — no active previews. */
const FEATURES: ActiveDesignFeature[] = [];

export const PRIMARY_DESIGN_FEATURE: DesignFeatureId = "user-access-modal";

export function listActiveDesignFeatures(): ActiveDesignFeature[] {
  return FEATURES;
}

export function getActiveDesignFeature(_id: DesignFeatureId): ActiveDesignFeature | null {
  return null;
}

export const ACTIVE_DESIGN_COUNT = FEATURES.length;
