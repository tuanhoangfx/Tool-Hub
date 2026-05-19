import { useEffect, useMemo, useState } from "react";
import { defaultRepositories } from "../data/repositories";
import { mergeRepos, resolveTool } from "../lib/tooling";
import { hydrateRepository, repoUrl } from "../services/github";
import type { LocalRegistry, ResolvedTool, ToolRemoteState, ToolRepository } from "../types";

export function useRepositories() {
  const [selectedId, setSelectedId] = useState(defaultRepositories[0].id);
  const [remoteStates, setRemoteStates] = useState<Record<string, ToolRemoteState>>({});
  const [loadingAll, setLoadingAll] = useState(false);
  const [localRegistry, setLocalRegistry] = useState<LocalRegistry | undefined>();
  const [customRepos, setCustomRepos] = useState<ToolRepository[]>(() => {
    const raw = localStorage.getItem("github-tool-manager.customRepos");
    if (!raw) return [];

    try {
      return JSON.parse(raw) as ToolRepository[];
    } catch {
      return [];
    }
  });
  const [repoDraft, setRepoDraft] = useState("");
  const [registryError, setRegistryError] = useState("");

  const repositories = useMemo(
    () => mergeRepos(defaultRepositories, localRegistry?.repositories ?? [], customRepos),
    [customRepos, localRegistry?.repositories],
  );

  const resolvedTools = useMemo(
    () => repositories.map((repo) => resolveTool(repo, remoteStates[repo.id], repoUrl)),
    [remoteStates, repositories],
  );

  const selectedTool = resolvedTools.find((tool) => tool.id === selectedId) ?? resolvedTools[0];

  async function refreshOne(repo: ToolRepository) {
    if (!repo.repo) return;

    setRemoteStates((current) => ({
      ...current,
      [repo.id]: { id: repo.id, loading: true, files: current[repo.id]?.files ?? [] },
    }));

    const remote = await hydrateRepository(repo);
    setRemoteStates((current) => ({ ...current, [repo.id]: remote }));
  }

  async function refreshAll() {
    setLoadingAll(true);
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

  function addRepo() {
    const normalized = repoDraft.trim().replace(/^https:\/\/github\.com\//i, "").replace(/\.git$/i, "");
    if (!/^[\w.-]+\/[\w.-]+$/.test(normalized)) return;
    if (repositories.some((repo) => repo.repo.toLowerCase() === normalized.toLowerCase())) {
      setRepoDraft("");
      return;
    }

    const id = normalized.toLowerCase().replace(/[^\w]+/g, "-");
    const name = normalized.split("/")[1].replaceAll("-", " ");
    const repo: ToolRepository = {
      id,
      code: "CUSTOM",
      name,
      repo: normalized,
      branch: "main",
      category: "Custom",
      audience: "Public users",
      status: "Needs review",
      summary: "Custom public GitHub tool repository added in this browser.",
      localPath: "",
      tags: ["GitHub", "Custom"],
      usage: ["Open README.md from GitHub.", "Use latest release asset when available."],
      downloadHint: "Release asset or repository source.",
      manifestPath: "tool.manifest.json",
      trackedFiles: ["tool.manifest.json", "package.json", "README.md", "CHANGELOG.md"],
      scriptFiles: ["scripts/sync-changelog.mjs", "scripts/sync-metadata-version.mjs"],
    };

    const next = [...customRepos, repo];
    setCustomRepos(next);
    localStorage.setItem("github-tool-manager.customRepos", JSON.stringify(next));
    setRepoDraft("");
    setSelectedId(repo.id);
  }

  function removeCustomRepo(id: string) {
    const next = customRepos.filter((repo) => repo.id !== id);
    setCustomRepos(next);
    localStorage.setItem("github-tool-manager.customRepos", JSON.stringify(next));
    setSelectedId(defaultRepositories[0].id);
  }

  useEffect(() => {
    if (repositories.length === 0) return undefined;
    const timer = window.setTimeout(() => {
      void refreshAll();
    }, 0);
    return () => window.clearTimeout(timer);
    // Initial and registry-load refresh only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repositories.length]);

  return {
    selectedId,
    setSelectedId,
    repositories,
    resolvedTools,
    selectedTool,
    loadingAll,
    localRegistry,
    repoDraft,
    setRepoDraft,
    registryError,
    refreshOne,
    refreshAll,
    loadLocalRegistry,
    addRepo,
    removeCustomRepo,
  };
}

export type UseRepositoriesResult = ReturnType<typeof useRepositories>;
export type SelectedTool = ResolvedTool;
