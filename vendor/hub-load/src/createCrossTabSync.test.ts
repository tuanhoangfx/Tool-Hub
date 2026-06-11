import { afterEach, describe, expect, it, vi } from "vitest";
import { createCrossTabSync } from "./createCrossTabSync";

describe("createCrossTabSync", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("delivers broadcast messages to subscribers", () => {
    const listeners = new Map<string, Set<(ev: MessageEvent) => void>>();
    class MockChannel {
      name: string;
      constructor(name: string) {
        this.name = name;
        if (!listeners.has(name)) listeners.set(name, new Set());
      }
      postMessage(data: unknown) {
        for (const fn of listeners.get(this.name) ?? []) {
          fn({ data } as MessageEvent);
        }
      }
      addEventListener(_type: string, fn: (ev: MessageEvent) => void) {
        listeners.get(this.name)?.add(fn);
      }
      removeEventListener(_type: string, fn: (ev: MessageEvent) => void) {
        listeners.get(this.name)?.delete(fn);
      }
    }
    vi.stubGlobal("BroadcastChannel", MockChannel);

    const sync = createCrossTabSync({ channelName: "test-channel" });
    const received: string[] = [];
    const unsub = sync.subscribe((msg) => received.push(`${msg.type}:${msg.source}`));
    sync.post("local-updated", "user-1");
    unsub();
    expect(received).toEqual(["local-updated:broadcast"]);
  });

  it("fires on matching storage keys", () => {
    vi.stubGlobal("BroadcastChannel", undefined);
    const sync = createCrossTabSync({
      channelName: "unused",
      storageKeyPrefix: "vault:",
    });
    const received: string[] = [];
    const unsub = sync.subscribe((msg) => received.push(msg.type));
    window.dispatchEvent(
      new StorageEvent("storage", { key: "vault:abc", newValue: "[]" }),
    );
    window.dispatchEvent(new StorageEvent("storage", { key: "other", newValue: "x" }));
    unsub();
    expect(received).toEqual(["storage-updated"]);
  });
});
