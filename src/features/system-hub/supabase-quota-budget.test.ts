import { describe, expect, it } from "vitest";
import { formatApiUsageInline } from "./supabase-quota-metrics";
import { computeQuotaBudget, percentUsed, resolveQuotaHeadlineStatus, statusFromPercent } from "./supabase-quota-budget";

describe("supabase-quota-budget", () => {
  it("computes DB disk percent from used and entitlement limit", () => {
    const lines = computeQuotaBudget(
      {
        usage: {
          diskUtil: { metrics: { fs_used_bytes: 274_000_000, fs_avail_bytes: 226_000_000 } },
        },
      },
      { entitlements: { entitlements: [{ feature: { key: "database.size" }, config: { value: 536_870_912 } }] } },
    );
    const db = lines.find((l) => l.key === "db_disk");
    expect(db?.percent).toBeGreaterThan(50);
    expect(db?.status).toBe("ok");
  });

  it("marks restricted headline when health reports violation", () => {
    const headline = resolveQuotaHeadlineStatus(
      {
        usage: {
          health: [{ name: "auth", healthy: false, status: "UNHEALTHY", error: "violations: exceed_egress_quota" }],
        },
      },
      null,
    );
    expect(headline.status).toBe("restricted");
    expect(headline.label).toBe("Restricted");
  });

  it("merges API total and per-minute rates in one line", () => {
    const line = formatApiUsageInline({
      apiRequestsTotal: 1_300_000,
      restLatest: 42,
      authLatest: 0,
      realtimeLatest: 0,
      storageLatest: null,
      usageWindow: null,
    });
    expect(line).toContain("1.3M total");
    expect(line).toContain("REST 42");
    expect(line).toContain("/min");
  });

  it("warns at 80% disk", () => {
    expect(statusFromPercent(82, false)).toBe("warn");
    expect(percentUsed(410, 500)).toBe(82);
  });
});
