import { describe, expect, it } from "vitest";
import {
  hubAuthEmailFromLogin,
  hubDisplayEmail,
  hubDisplayLoginId,
  isHubSyntheticEmail,
  normalizeLoginId,
  resolveHubLogin,
} from "./hub-login";

describe("hub-login", () => {
  it("resolves user id to synthetic auth email", () => {
    const r = resolveHubLogin("alice");
    expect(r.authEmail).toBe("alice@id.hub.x1z10.local");
    expect(r.loginId).toBe("alice");
    expect(r.isEmailLogin).toBe(false);
  });

  it("passes through real email", () => {
    const r = resolveHubLogin("a@corp.com");
    expect(r.authEmail).toBe("a@corp.com");
    expect(r.isEmailLogin).toBe(true);
  });

  it("detects synthetic emails", () => {
    expect(isHubSyntheticEmail("bob@id.hub.x1z10.local")).toBe(true);
    expect(isHubSyntheticEmail("bob@corp.com")).toBe(false);
  });

  it("display helpers hide synthetic auth email", () => {
    expect(
      hubDisplayEmail({
        authEmail: "x@id.hub.x1z10.local",
        contactEmail: "real@corp.com",
      }),
    ).toBe("real@corp.com");
    expect(hubDisplayLoginId({ authEmail: "x@id.hub.x1z10.local" })).toBe("x");
  });

  it("validates login id", () => {
    expect(normalizeLoginId("ab")).toBeNull();
    expect(normalizeLoginId("abc")).toBe("abc");
    expect(hubAuthEmailFromLogin("abc")).toBe("abc@id.hub.x1z10.local");
  });
});
