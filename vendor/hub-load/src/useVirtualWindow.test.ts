import { describe, expect, it } from "vitest";
import { virtualWindowContentHeight, virtualWindowStride } from "./useVirtualWindow";

describe("virtualWindow helpers", () => {
  it("computes stride with row gap", () => {
    expect(virtualWindowStride(48, 2)).toBe(50);
  });

  it("computes content height with gaps between rows", () => {
    expect(virtualWindowContentHeight(3, 48, 2)).toBe(48 * 3 + 2 * 2);
  });
});
