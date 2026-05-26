import { useEffect, useMemo, useState } from "react";
import { FALLBACK_REPOSITORIES, loadDefaultRepositories } from "../data/repositories";
import { clearCache } from "../lib/cache";
import { mergeRepos, resolveTool } from "../lib/tooling";
import { hydrateRepository, repoUrl } from "../services/github";
import type { LocalRegistry, ToolRemoteState, ToolRepository } from "../types";

export function useRepositories() {
  const [defaultRepos, setDefaultRepos] = useState<ToolRepository[]>(FALLBACK_REPOSITORIES);
  const [selectedId, setSelectedId] = useState(FALLBACK_REPOSITORIES[0].id);
  const [remoteStates, setRemoteStates] = useState<Record<string, ToolRemoteState>>({});
  const [loadingAll, setLoadingAll] = useState(false);
  const [localRegistry, setLocalRegistry] = useState<LocalRegistry | undefined>();
  const [registryError, setRegistryError] = useState("");

  const repositories = useMemo(
    () => mergeRepos(defaultRepos, localRegistry?.repositories ?? []),
    [defaultRepos, localRegistry?.repositories],
  );

  const resolvedTools = useMemo(
    () => repositories.map((repo) => resolveTool(repo, remoteStates[repo.id], repoUrl)),
    [remoteStates, repositories],
  );

  function remoteHasChangelog(state?: ToolRemoteState) {
    return Boolean(state?.files?.some((f) => f.path.toLowerCase() === "changelog.md" && f.ok && f.text));
  }

  async function refreshOne(repo: ToolRepository) {
    if (!repo.repo) return;

    setRemoteStates((current) => {
      const prev = current[repo.id];
      return {
        ...current,
        [repo.id]: prev
          ? { ...prev, loading: true }
          : { id: repo.id, loading: true, files: [] },
      };
    });

    const remote = await hydrateRepository(repo);
    setRemoteStates((current) => ({ ...current, [repo.id]: remote }));
  }

  /** Load GitHub remote (incl. CHANGELOG) for one tool — skips if already hydrated. */
  async function prefetchRemote(toolId: string) {
    const repo = repositories.find((r) => r.id === toolId);
    if (!repo?.repo) return;
    const existing = remoteStates[repo.id];
    if (existing?.loading) return;
    if (remoteHasChangelog(existing)) return;
    await refreshOne(repo);
  }

  async function refreshAll() {
    setLoadingAll(true);
    clearCache();
    await Promise.all(repositories.map((repo) => refreshOne(repo)));
    setLoadingAll(false);
  }

  async function loadLocalRegistry() {
    try {
      const response = await fetch(`/local-registry.json?t=${Date.now()}`, { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setLocalRegistry((await response.json()) as LocalRegistry);
      setRegistryError("");
    } catch (error) {
      setRegistryError(error instanceof Error ? error.message : "Khong doc duoc local-registry.json");
    }
  }

  useEffect(() => {
    let cancelled = false;
    void loadDefaultRepositories().then((repos) => {
      if (cancelled) return;
      setDefaultRepos(repos);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (repositories.length === 0) return undefined;
    const timer = window.setTimeout(() => {
      void refreshAll();
    }, 0);
    return () => window.clearTimeout(timer);
    // Refresh whenever the catalog size changes (initial load, registry load).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repositories]);

  async function refreshTool(toolId: string) {
    const repo = repositories.find((r) => r.id === toolId);
    if (repo) await refreshOne(repo);
  }

  return {
    selectedId,
    setSelectedId,
    resolvedTools,
    loadingAll,
    localRegistry,
    registryError,
    refreshAll,
    refreshTool,
    prefetchRemote,
    loadLocalRegistry,
  };
}
