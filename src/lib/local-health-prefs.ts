export type LocalHealthPollValue = "off" | "6h" | "12h" | "1d" | "3d" | "1w";

/** Manual-only by default — no background port probes until user opts in. */
export const DEFAULT_LOCAL_HEALTH_POLL: LocalHealthPollValue = "off";

export const LOCAL_HEALTH_POLL_OPTIONS: { value: LocalHealthPollValue; label: string }[] = [
  { value: "off", label: "Off" },
  { value: "6h", label: "6h" },
  { value: "12h", label: "12h" },
  { value: "1d", label: "1d" },
  { value: "3d", label: "3d" },
  { value: "1w", label: "1w" },
];

const INTERVAL_MS: Record<Exclude<LocalHealthPollValue, "off">, number> = {
  "6h": 6 * 60 * 60 * 1000,
  "12h": 12 * 60 * 60 * 1000,
  "1d": 24 * 60 * 60 * 1000,
  "3d": 3 * 24 * 60 * 60 * 1000,
  "1w": 7 * 24 * 60 * 60 * 1000,
};

const VALID = new Set<string>(LOCAL_HEALTH_POLL_OPTIONS.map((o) => o.value));

/** Legacy second-based URL values from earlier Hub builds. */
const LEGACY_SECONDS = new Set(["30", "60", "90", "120"]);

export function parseLocalHealthPoll(raw: string | null | undefined): LocalHealthPollValue {
  if (!raw || LEGACY_SECONDS.has(raw)) return DEFAULT_LOCAL_HEALTH_POLL;
  if (!VALID.has(raw)) return DEFAULT_LOCAL_HEALTH_POLL;
  return raw as LocalHealthPollValue;
}

/** Milliseconds between background probes, or `null` when polling is off. */
export function resolveLocalHealthPollMs(value: LocalHealthPollValue): number | null {
  if (value === "off") return null;
  return INTERVAL_MS[value];
}

export function isDefaultLocalHealthPoll(value: LocalHealthPollValue): boolean {
  return value === DEFAULT_LOCAL_HEALTH_POLL;
}

export function formatLocalHealthPollInterval(value: LocalHealthPollValue): string {
  if (value === "off") return "manual only";
  return `every ${value}`;
}
