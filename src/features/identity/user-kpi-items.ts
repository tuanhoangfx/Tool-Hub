import { Activity, Crown, Moon, Package, Shield, UserCircle, Users } from "lucide-react";
import type { KpiTileData } from "../../components/sales-shell";

export type UserKpiNumbers = {
  total: number;
  active: number;
  admins: number;
  managers: number;
  members: number;
  toolGrants: number;
  withTools: number;
  idle: number;
};

const USER_KPI_TILES: Array<{
  key: string;
  label: string;
  tone: KpiTileData["tone"];
  icon: KpiTileData["icon"];
  pick: (k: UserKpiNumbers) => number;
}> = [
  { key: "total", label: "Users (shown)", tone: "indigo", icon: Users, pick: (k) => k.total },
  { key: "active", label: "Active now", tone: "emerald", icon: Activity, pick: (k) => k.active },
  { key: "admins", label: "Admins", tone: "amber", icon: Crown, pick: (k) => k.admins },
  { key: "managers", label: "Managers", tone: "purple", icon: Shield, pick: (k) => k.managers },
  { key: "members", label: "Members", tone: "purple", icon: UserCircle, pick: (k) => k.members },
  { key: "tool_grants", label: "Tool grants", tone: "indigo", icon: Package, pick: (k) => k.toolGrants },
  { key: "with_tools", label: "With tool access", tone: "emerald", icon: Package, pick: (k) => k.withTools },
  { key: "idle", label: "Idle / offline", tone: "rose", icon: Moon, pick: (k) => k.idle },
];

export function buildUserKpiItems(kpis: UserKpiNumbers): KpiTileData[] {
  return USER_KPI_TILES.map((row) => ({
    prefKey: row.key,
    label: row.label,
    value: row.pick(kpis),
    icon: row.icon,
    tone: row.tone,
  }));
}
