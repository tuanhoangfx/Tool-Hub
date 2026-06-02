import { useCallback, useEffect, useState } from "react";
import { readAppScreen } from "../lib/app-screen";
import { buildAppUrl } from "../lib/hub-path";
import { sanitizeQueryForScreen } from "../lib/hub-query";

type UrlState = {
  tool: string | null;
  detail: boolean;
};

function readUrl(): UrlState {
  if (typeof window === "undefined") return { tool: null, detail: false };
  const params = new URLSearchParams(window.location.search);
  return {
    tool: params.get("tool"),
    detail: params.get("detail") === "1",
  };
}

function writeUrl(next: UrlState, options: { replace?: boolean } = {}) {
  if (typeof window === "undefined") return;
  const screen = readAppScreen();
  const params = sanitizeQueryForScreen(screen, window.location.search);
  if (next.tool) params.set("tool", next.tool);
  else params.delete("tool");
  if (next.detail) params.set("detail", "1");
  else params.delete("detail");
  const url = `${buildAppUrl(screen, params.toString())}${window.location.hash}`;
  if (options.replace) window.history.replaceState(null, "", url);
  else window.history.pushState(null, "", url);
}

export function useUrlState() {
  const [state, setState] = useState<UrlState>(() => readUrl());

  useEffect(() => {
    const onPop = () => setState(readUrl());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const update = useCallback((patch: Partial<UrlState>, options?: { replace?: boolean }) => {
    setState((prev) => {
      const next = { ...prev, ...patch };
      writeUrl(next, options);
      return next;
    });
  }, []);

  return { state, update };
}
