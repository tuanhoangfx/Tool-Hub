export type DesignFeatureId = never;

export type ActiveDesignFeature = {
  id: DesignFeatureId;
  title: string;
  subtitle: string;
  template?: string;
  lockedVariant?: string;
};

const FEATURES: ActiveDesignFeature[] = [];

export function listActiveDesignFeatures(): ActiveDesignFeature[] {
  return FEATURES;
}

export function getActiveDesignFeature(_id: DesignFeatureId): ActiveDesignFeature | null {
  return null;
}

export const ACTIVE_DESIGN_COUNT = FEATURES.length;
