import { afterEach, describe, expect, it, vi } from "vitest";
import { createClientCache } from "./createClientCache";

describe("createClientCache", () => {
  afterEach(() => {
    if (typeof sessionStorage !== "undefined") sessionStorage.clear();
    if (typeof localStorage !== "undefined") localStorage.clear();
    vi.restoreAllMocks();
  });

  it("reads stale after TTL expires", () => {
    const cache = createClientCache<string[]>({
      key: "test:v1",
      ttlMs: 1000,
      validate: (d): d is string[] => Array.isArray(d),
    });
    cache.write(["a"]);
    vi.spyOn(Date, "now").mockReturnValue(Date.now() + 5000);
    expect(cache.readFresh()).toBeNull();
    expect(cache.readStale()).toEqual(["a"]);
  });

  it("reads fresh within TTL", () => {
    const cache = createClientCache<number>({ key: "n:v1", ttlMs: 60_000 });
    cache.write(42);
    expect(cache.readFresh()).toBe(42);
  });
});
