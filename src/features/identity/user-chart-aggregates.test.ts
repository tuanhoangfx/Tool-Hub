import { describe, expect, it } from "vitest";
import { userCharts } from "./user-chart-aggregates";
import type { UserManagementRow } from "./userManagementRepository";

function row(partial: Partial<UserManagementRow> & Pick<UserManagementRow, "id">): UserManagementRow {
  return {
    fullName: "User",
    email: "u@test",
    loginId: "u",
    role: "user",
    avatarUrl: null,
    createdAt: null,
    updatedAt: null,
    lastActiveAt: null,
    projectCount: 0,
    projectNames: [],
    toolCount: 0,
    toolCodes: [],
    activityCount: 0,
    status: "offline",
    ...partial,
  };
}

describe("userCharts", () => {
  it("returns chart bands with legend icons per dimension", () => {
    const rows = [
      row({ id: "1", role: "admin", status: "online", toolCount: 0, activityCount: 1 }),
      row({ id: "2", role: "manager", status: "active", toolCount: 1, activityCount: 0 }),
      row({ id: "3", role: "user", status: "idle", toolCount: 4, activityCount: 2 }),
      row({ id: "4", role: "viewer", status: "offline", toolCount: 2, activityCount: 0 }),
    ];
    const charts = userCharts(rows);
    expect(charts.role.length).toBe(3);
    expect(charts.activity.length).toBe(4);
    expect(charts.tool.length).toBe(4);
    expect(charts.distribution.length).toBe(2);
    for (const band of Object.values(charts)) {
      expect(band.some((r) => r.iconMeta)).toBe(true);
    }
  });

  it("maps role labels for legend icons", () => {
    const charts = userCharts([
      row({ id: "1", role: "admin" }),
      row({ id: "2", role: "manager" }),
      row({ id: "3", role: "user" }),
    ]);
    expect(charts.role.map((r) => r.label)).toContain("Admin");
    expect(charts.role.map((r) => r.label)).toContain("Manager");
    expect(charts.role.some((r) => r.iconMeta)).toBe(true);
  });

  it("buckets tool access for tool chart", () => {
    const charts = userCharts([
      row({ id: "1", toolCount: 0 }),
      row({ id: "2", toolCount: 1 }),
      row({ id: "3", toolCount: 2 }),
      row({ id: "4", toolCount: 5 }),
    ]);
    const labels = charts.tool.map((r) => r.label);
    expect(labels).toContain("No tools");
    expect(labels).toContain("1 tool");
  });
});
