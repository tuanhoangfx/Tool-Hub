const LAUNCHER_BASE = "http://127.0.0.1:5190";

export type VersionPipelineAction = "sync" | "commit" | "push" | "all";

export type VersionPipelineStep = {
  step: string;
  ok: boolean;
  skipped?: boolean;
  detail: string;
};

export type VersionPipelineResult = {
  ok: boolean;
  version?: string;
  cwd?: string;
  steps: VersionPipelineStep[];
  message?: string;
};

export async function fetchLauncherOnline(): Promise<boolean> {
  try {
    const res = await fetch(`${LAUNCHER_BASE}/health`, { signal: AbortSignal.timeout(2000) });
    if (!res.ok) return false;
    const data = (await res.json()) as { ok?: boolean };
    return Boolean(data.ok);
  } catch {
    return false;
  }
}

export async function runVersionPipeline(opts: {
  cwd: string;
  version: string;
  branch?: string;
  action: VersionPipelineAction;
  /** Commit / All: bump patch and sync docs by default. */
  bumpOnCommit?: boolean;
  commitTitle?: string;
}): Promise<VersionPipelineResult> {
  const actions = opts.action === "all" ? ["commit", "push"] : [opts.action];
  const bumpOnCommit =
    opts.bumpOnCommit !== false && (opts.action === "commit" || opts.action === "all");

  try {
    const res = await fetch(`${LAUNCHER_BASE}/version-pipeline`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cwd: opts.cwd,
        version: opts.version,
        branch: opts.branch ?? "main",
        actions,
        bumpOnCommit,
        commitTitle: opts.commitTitle,
      }),
      signal: AbortSignal.timeout(120_000),
    });
    const data = (await res.json()) as VersionPipelineResult;
    if (!res.ok && !data.steps) {
      return { ok: false, steps: [], message: data.message ?? `HTTP ${res.status}` };
    }
    return data;
  } catch (err) {
    return {
      ok: false,
      steps: [],
      message:
        err instanceof Error
          ? `${err.message}. Run Hub dev (launcher port 5190) or pnpm launcher`
          : "Launcher did not respond",
    };
  }
}
