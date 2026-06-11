/** BroadcastChannel + storage event — shared local cache sync across tabs (same origin). */

export type CrossTabSyncMessage = {
  type: string;
  scopeKey: string | null;
  at: number;
  source: "broadcast" | "storage";
};

export type CreateCrossTabSyncOptions = {
  channelName: string;
  /** When set, listen for storage events on this exact key. */
  storageKey?: string;
  /** When set, listen for keys starting with this prefix. */
  storageKeyPrefix?: string;
  /** Custom matcher — overrides storageKey / storageKeyPrefix when provided. */
  matchesStorageKey?: (key: string) => boolean;
};

function keyMatches(key: string, opts: CreateCrossTabSyncOptions): boolean {
  if (opts.matchesStorageKey) return opts.matchesStorageKey(key);
  if (opts.storageKey && key === opts.storageKey) return true;
  if (opts.storageKeyPrefix && key.startsWith(opts.storageKeyPrefix)) return true;
  return false;
}

export function createCrossTabSync(opts: CreateCrossTabSyncOptions) {
  let channel: BroadcastChannel | null = null;

  function getChannel(): BroadcastChannel | null {
    if (typeof BroadcastChannel === "undefined") return null;
    if (!channel) {
      try {
        channel = new BroadcastChannel(opts.channelName);
      } catch {
        return null;
      }
    }
    return channel;
  }

  function post(type: string, scopeKey: string | null): void {
    const ch = getChannel();
    if (!ch) return;
    const msg: CrossTabSyncMessage = { type, scopeKey, at: Date.now(), source: "broadcast" };
    ch.postMessage(msg);
  }

  function subscribe(handler: (msg: CrossTabSyncMessage) => void): () => void {
    const cleanups: Array<() => void> = [];

    const ch = getChannel();
    if (ch) {
      const onMessage = (ev: MessageEvent<CrossTabSyncMessage>) => {
        const data = ev.data;
        if (!data?.type || data.source === "storage") return;
        handler({ ...data, source: "broadcast" });
      };
      ch.addEventListener("message", onMessage);
      cleanups.push(() => ch.removeEventListener("message", onMessage));
    }

    if (typeof window !== "undefined") {
      const onStorage = (ev: StorageEvent) => {
        if (!ev.key || !keyMatches(ev.key, opts)) return;
        handler({
          type: "storage-updated",
          scopeKey: null,
          at: Date.now(),
          source: "storage",
        });
      };
      window.addEventListener("storage", onStorage);
      cleanups.push(() => window.removeEventListener("storage", onStorage));
    }

    return () => {
      for (const fn of cleanups) fn();
    };
  }

  return { post, subscribe };
}
