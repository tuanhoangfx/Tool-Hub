import type { DesignFeatureId } from "../../../lib/design-template-state";

export type ActiveDesignFeature = {
  id: DesignFeatureId;
  title: string;
  subtitle: string;
  template: "tool-access" | "agent-context";
};

const FEATURES: ActiveDesignFeature[] = [];

export const PRIMARY_DESIGN_FEATURE: DesignFeatureId = "agent-context";

export function listActiveDesignFeatures(): ActiveDesignFeature[] {
  return FEATURES;
}

export function getActiveDesignFeature(_id: DesignFeatureId): ActiveDesignFeature | null {
  return null;
}

export const ACTIVE_DESIGN_COUNT = FEATURES.length;
