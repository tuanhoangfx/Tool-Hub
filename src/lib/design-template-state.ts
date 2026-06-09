const STORAGE_KEY = "hub:design-template:locked";

export type DesignFeatureId = "user-access-modal" | "agent-context" | "auth-gate";

const ALL_FEATURES: DesignFeatureId[] = ["user-access-modal", "agent-context", "auth-gate"];

function readLocked(): DesignFeatureId[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((x): x is DesignFeatureId => ALL_FEATURES.includes(x as DesignFeatureId))
      : [];
  } catch {
    return [];
  }
}

export function isDesignLocked(featureId: DesignFeatureId): boolean {
  return readLocked().includes(featureId);
}

export function lockDesign(featureId: DesignFeatureId) {
  const next = new Set([...readLocked(), featureId]);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
  window.dispatchEvent(new CustomEvent("design-template-change"));
}

export function unlockDesign(featureId: DesignFeatureId) {
  const next = readLocked().filter((id) => id !== featureId);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("design-template-change"));
}

export function clearAllLockedDesigns() {
  window.localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent("design-template-change"));
}

/** Dev helper: restore agent-context preview after accidental lock. */
export function unlockAgentContextDesign() {
  unlockDesign("agent-context");
}

/** Auth gate V1 shipped — locked by default in localStorage on first read if missing. */
export function ensureAuthGateDesignLocked() {
  if (!readLocked().includes("auth-gate")) {
    lockDesign("auth-gate");
  }
}

/** User modal shell V5 shipped — lock on Design Template mount. */
export function ensureUserAccessModalShellLocked() {
  if (!readLocked().includes("user-access-modal")) {
    lockDesign("user-access-modal");
  }
}
