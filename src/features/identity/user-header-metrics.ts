import { CheckCircle2, Package, ShieldCheck, UserRound } from "lucide-react";
import type { TabHeaderStatItem } from "@tool-workspace/hub-ui";
import type { PrefItem } from "../../components/sales-shell/DisplayPrefs";

export type UserHeaderStatKey = "active" | "admins" | "managers" | "grants";

export const USER_HEADER_STAT_DEFS: PrefItem[] = [
  { key: "active", label: "Active" },
  { key: "admins", label: "Admins" },
  { key: "managers", label: "Managers" },
  { key: "grants", label: "Tool grants" },
];

export const DEFAULT_USER_HEADER_STAT_KEYS = new Set<UserHeaderStatKey>(["active", "admins", "grants"]);

export type UserHeaderKpi = {
  active: number;
  admins: number;
  managers: number;
  toolGrants: number;
};

const STAT_DEFS: Record<
  UserHeaderStatKey,
  { icon: typeof CheckCircle2; label: string; toneClass: string; pick: (k: UserHeaderKpi) => number }
> = {
  active: { icon: CheckCircle2, label: "active", toneClass: "text-emerald-300", pick: (k) => k.active },
  admins: { icon: ShieldCheck, label: "admins", toneClass: "text-indigo-300", pick: (k) => k.admins },
  managers: { icon: UserRound, label: "managers", toneClass: "text-purple-300", pick: (k) => k.managers },
  grants: { icon: Package, label: "grants", toneClass: "text-amber-300", pick: (k) => k.toolGrants },
};

export function buildUserHeaderStats(visibleKeys: Set<string>, kpi: UserHeaderKpi): TabHeaderStatItem[] {
  return USER_HEADER_STAT_DEFS.filter((h) => visibleKeys.has(h.key)).map((h) => {
    const def = STAT_DEFS[h.key as UserHeaderStatKey];
    return {
      key: h.key,
      icon: def.icon,
      label: def.label,
      value: def.pick(kpi),
      toneClass: def.toneClass,
    };
  });
}
