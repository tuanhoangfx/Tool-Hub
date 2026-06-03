export type LocalHealthPollValue = "off" | "30" | "60" | "90" | "120";

export const DEFAULT_LOCAL_HEALTH_POLL: LocalHealthPollValue = "90";

export const LOCAL_HEALTH_POLL_OPTIONS: { value: LocalHealthPollValue; label: string }[] = [
  { value: "off", label: "Off — only when you click Local health" },
  { value: "30", label: "Auto every 30 seconds" },
  { value: "60", label: "Auto every 60 seconds" },
  { value: "90", label: "Auto every 90 seconds" },
  { value: "120", label: "Auto every 2 minutes" },
];

const VALID = new Set<string>(LOCAL_HEALTH_POLL_OPTIONS.map((o) => o.value));

export function parseLocalHealthPoll(raw: string | null | undefined): LocalHealthPollValue {
  if (!raw || !VALID.has(raw)) return DEFAULT_LOCAL_HEALTH_POLL;
  return raw as LocalHealthPollValue;
}

/** Milliseconds between background probes, or `null` when polling is off. */
export function resolveLocalHealthPollMs(value: LocalHealthPollValue): number | null {
  if (value === "off") return null;
  return Number(value) * 1000;
}

export function localHealthPollLabel(value: LocalHealthPollValue): string {
  return LOCAL_HEALTH_POLL_OPTIONS.find((o) => o.value === value)?.label ?? value;
}
