import { createClientCache } from "@dev/hub-load";
import type { HubToolRow } from "./toolAccessRepository";
import type { UserManagementRow } from "./userManagementRepository";

export type UserManagementCacheData = {
  rows: UserManagementRow[];
  hubTools: HubToolRow[];
};

export const userManagementCache = createClientCache<UserManagementCacheData>({
  key: "users:management:v1",
  ttlMs: 3 * 60_000,
  validate: (data): data is UserManagementCacheData =>
    typeof data === "object" &&
    data !== null &&
    Array.isArray((data as UserManagementCacheData).rows),
});

/** Any cached snapshot (for instant paint; may be past TTL). */
export function readUserManagementStaleCache(): UserManagementCacheData | null {
  const data = userManagementCache.readStale();
  if (!data) return null;
  return { rows: data.rows, hubTools: data.hubTools ?? [] };
}

/** Fresh cache within TTL. */
export function readUserManagementClientCache(): UserManagementCacheData | null {
  const data = userManagementCache.readFresh();
  if (!data) return null;
  return { rows: data.rows, hubTools: data.hubTools ?? [] };
}

export function writeUserManagementClientCache(rows: UserManagementRow[], hubTools: HubToolRow[]) {
  userManagementCache.write({ rows, hubTools });
}
