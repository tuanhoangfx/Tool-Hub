import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FALLBACK_REPOSITORIES, loadDefaultRepositories } from "../data/repositories";
import {
  readHubCatalogStaleCache,
  sanitizeHubRemoteStates,
  writeHubCatalogCache,
} from "../lib/hub-catalog-client-cache";
import { clearCache } from "../lib/github-api-cache";
import { mergeRepos, resolveTool } from "../lib/tooling";
import { hydrateRepository, repoUrl } from "../services/github";
import type { LocalRegistry, ToolRemoteState, ToolRepository } from "../types";

function readCatalogBootstrap() {
  if (typeof window === "undefined") return null;
  return readHubCatalogStaleCache();
}

export function useRepositories() {
  const bootstrapRef = useRef(readCatalogBootstrap());
  const bootstrap = bootstrapRef.current;

  const [defaultRepos, setDefaultRepos] = useState<ToolRepository[]>(
    () => bootstrap?.defaultRepos ?? FALLBACK_REPOSITORIES,
  );
  const [selectedId, setSelectedId] = useState(
    () => bootstrap?.defaultRepos?.[0]?.id ?? FALLBACK_REPOSITORIES[0].id,
  );
  const [remoteStates, setRemoteStates] = useState<Record<string, ToolRemoteState>>(
    () => bootstrap?.remoteStates ?? {},
  );
  const [loadingAll, setLoadingAll] = useState(false);
  /** True once catalog can paint (cache, registry JSON, or defaults). GitHub may still sync. */
  const [hubCatalogReady, setHubCatalogReady] = useState(
    () =>
      Boolean(
        bootstrap?.localRegistry?.repositories?.length ||
          bootstrap?.defaultRepos?.length ||
          FALLBACK_REPOSITORIES.length,
      ),
  );
  const [localRegistry, setLocalRegistry] = useState<LocalRegistry | undefined>(() => bootstrap?.localRegistry);
  const [registryError, setRegistryError] = useState("");

  const repositories = useMemo(
    () => mergeRepos(defaultRepos, localRegistry?.repositories ?? []),
    [defaultRepos, localRegistry?.repositories],
  );

  const resolvedTools = useMemo(
    () => repositories.map((repo) => resolveTool(repo, remoteStates[repo.id], repoUrl)),
    [remoteStates, repositories],
  );

  const persistCatalog = useCallback(() => {
    writeHubCatalogCache({
      defaultRepos,
      localRegistry,
      remoteStates,
    });
  }, [defaultRepos, localRegistry, remoteStates]);

  useEffect(() => {
    if (!hubCatalogReady) return;
    persistCatalog();
  }, [hubCatalogReady, persistCatalog]);

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
    try {
      await Promise.all(repositories.map((repo) => refreshOne(repo)));
    } finally {
      setLoadingAll(false);
      setHubCatalogReady(true);
      setRemoteStates((current) => sanitizeHubRemoteStates(current));
    }
  }

  const loadLocalRegistry = useCallback(async () => {
    try {
      const response = await fetch(`/local-registry.json?t=${Date.now()}`, { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const registry = (await response.json()) as LocalRegistry;
      setLocalRegistry(registry);
      setRegistryError("");
      setHubCatalogReady(true);
    } catch (error) {
      setRegistryError(error instanceof Error ? error.message : "Unable to read local-registry.json");
      if (defaultRepos.length > 0) setHubCatalogReady(true);
    }
  }, [defaultRepos.length]);

  useEffect(() => {
    let cancelled = false;
    void loadDefaultRepositories().then((repos) => {
      if (cancelled) return;
      setDefaultRepos(repos);
      setHubCatalogReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    void loadLocalRegistry();
  }, [loadLocalRegistry]);

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
    hubCatalogReady,
    localRegistry,
    registryError,
    refreshAll,
    refreshTool,
    prefetchRemote,
    loadLocalRegistry,
  };
}
