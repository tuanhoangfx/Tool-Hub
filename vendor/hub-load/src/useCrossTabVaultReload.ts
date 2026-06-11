import { useCallback, useEffect, useMemo, useRef } from "react";
import { createCrossTabSync, type CrossTabSyncMessage } from "./createCrossTabSync";

export type UseCrossTabVaultReloadOptions = {
  channelName: string;
  storageKey?: string;
  storageKeyPrefix?: string;
  matchesStorageKey?: (key: string) => boolean;
  getScopeKey: () => string | null;
  debounceMs?: number;
  onPeerReload: () => void;
};

export function useCrossTabVaultReload(opts: UseCrossTabVaultReloadOptions) {
  const debounceMs = opts.debounceMs ?? 120;
  const timerRef = useRef(0);
  const suppressPostRef = useRef(false);
  const onPeerReloadRef = useRef(opts.onPeerReload);
  const getScopeKeyRef = useRef(opts.getScopeKey);
  onPeerReloadRef.current = opts.onPeerReload;
  getScopeKeyRef.current = opts.getScopeKey;

  const sync = useMemo(
    () =>
      createCrossTabSync({
        channelName: opts.channelName,
        storageKey: opts.storageKey,
        storageKeyPrefix: opts.storageKeyPrefix,
        matchesStorageKey: opts.matchesStorageKey,
      }),
    [
      opts.channelName,
      opts.storageKey,
      opts.storageKeyPrefix,
      opts.matchesStorageKey,
    ],
  );

  useEffect(() => {
    const scheduleReload = (_source: CrossTabSyncMessage["source"]) => {
      window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        suppressPostRef.current = true;
        onPeerReloadRef.current();
        suppressPostRef.current = false;
      }, debounceMs);
    };

    const unsub = sync.subscribe((msg) => {
      if (msg.type === "storage-updated") {
        scheduleReload("storage");
        return;
      }
      if (msg.scopeKey !== getScopeKeyRef.current()) return;
      scheduleReload(msg.source);
    });

    return () => {
      unsub();
      window.clearTimeout(timerRef.current);
    };
  }, [sync, debounceMs]);

  const post = useCallback(
    (type: string, scopeKey?: string | null) => {
      if (suppressPostRef.current) return;
      sync.post(type, scopeKey ?? getScopeKeyRef.current());
    },
    [sync],
  );

  return { post, suppressPostRef };
}
