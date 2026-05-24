import { useCallback, useEffect, useState } from "react";

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
  const params = new URLSearchParams(window.location.search);
  params.delete("tab");
  if (next.tool) params.set("tool", next.tool);
  else params.delete("tool");
  if (next.detail) params.set("detail", "1");
  else params.delete("detail");
  const query = params.toString();
  const url = `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`;
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
