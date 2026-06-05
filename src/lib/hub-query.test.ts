import { describe, expect, it } from "vitest";
import { sanitizeQueryForScreen } from "./hub-query";

describe("sanitizeQueryForScreen", () => {
  it("keeps global shell prefs on users and system screens", () => {
    const search = "?hpin=0&spin=0&navicon=0&kpi=total&range=7d";
    const users = sanitizeQueryForScreen("users", search);
    expect(users.get("hpin")).toBe("0");
    expect(users.get("spin")).toBe("0");
    expect(users.get("navicon")).toBe("0");
    expect(users.get("kpi")).toBe("total");
    expect(users.has("range")).toBe(false);

    const system = sanitizeQueryForScreen("system", search);
    expect(system.get("hpin")).toBe("0");
    expect(system.get("spin")).toBe("0");
    expect(system.get("navicon")).toBe("0");
    expect(system.has("kpi")).toBe(false);
  });

  it("still strips hub-only keys on library screen", () => {
    const search = "?hpin=0&kpi=total&dt=sq";
    const library = sanitizeQueryForScreen("library", search);
    expect(library.get("hpin")).toBe("0");
    expect(library.get("kpi")).toBe("total");
    expect(library.has("dt")).toBe(false);
  });
});
