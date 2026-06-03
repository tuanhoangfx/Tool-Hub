import { describe, expect, it } from "vitest";
import {
  formatLocalHealthPollInterval,
  parseLocalHealthPoll,
  resolveLocalHealthPollMs,
} from "./local-health-prefs";

describe("local-health-prefs", () => {
  it("parseLocalHealthPoll defaults to off and migrates legacy seconds", () => {
    expect(parseLocalHealthPoll(null)).toBe("off");
    expect(parseLocalHealthPoll("90")).toBe("off");
    expect(parseLocalHealthPoll("nope")).toBe("off");
    expect(parseLocalHealthPoll("1d")).toBe("1d");
  });

  it("resolveLocalHealthPollMs maps off and calendar intervals", () => {
    expect(resolveLocalHealthPollMs("off")).toBeNull();
    expect(resolveLocalHealthPollMs("6h")).toBe(6 * 60 * 60 * 1000);
    expect(resolveLocalHealthPollMs("1w")).toBe(7 * 24 * 60 * 60 * 1000);
  });

  it("formatLocalHealthPollInterval", () => {
    expect(formatLocalHealthPollInterval("off")).toBe("manual only");
    expect(formatLocalHealthPollInterval("12h")).toBe("every 12h");
  });
});
