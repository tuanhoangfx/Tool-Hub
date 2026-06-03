import { describe, expect, it } from "vitest";
import { parseLocalHealthPoll, resolveLocalHealthPollMs } from "./local-health-prefs";

describe("local-health-prefs", () => {
  it("parseLocalHealthPoll defaults invalid to 90s", () => {
    expect(parseLocalHealthPoll(null)).toBe("90");
    expect(parseLocalHealthPoll("off")).toBe("off");
    expect(parseLocalHealthPoll("nope")).toBe("90");
  });

  it("resolveLocalHealthPollMs maps off and intervals", () => {
    expect(resolveLocalHealthPollMs("off")).toBeNull();
    expect(resolveLocalHealthPollMs("30")).toBe(30_000);
    expect(resolveLocalHealthPollMs("120")).toBe(120_000);
  });
});
