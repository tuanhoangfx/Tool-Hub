import { describe, expect, it } from "vitest";
import { normalizeToolCategory, toolCodeBadgeClass } from "./hub-tool-ui";

describe("normalizeToolCategory", () => {
  it("maps Web / Bot / Desktop", () => {
    expect(normalizeToolCategory("Web")).toBe("web");
    expect(normalizeToolCategory("Bot")).toBe("bot");
    expect(normalizeToolCategory("Desktop")).toBe("desktop");
  });

  it("returns distinct badge classes per kind", () => {
    expect(toolCodeBadgeClass("Web")).not.toBe(toolCodeBadgeClass("Bot"));
    expect(toolCodeBadgeClass("Desktop")).not.toBe(toolCodeBadgeClass("Web"));
  });
});
