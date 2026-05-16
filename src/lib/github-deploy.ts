export const GITHUB_REPO = "tuanhoangfx/GitHub-Tool-Manager";
export const GITHUB_ACTIONS_URL = `https://github.com/${GITHUB_REPO}/actions`;
export const GITHUB_PAGES_URL = `https://github.com/${GITHUB_REPO}/settings/pages`;
export const SITE_URL = "https://infix1.io.vn";

export type DeployRunStatus = {
  label: string;
  tone: "ok" | "warn" | "bad" | "neutral";
  url: string;
  updatedAt?: string;
};

type WorkflowRun = {
  status?: string;
  conclusion?: string | null;
  html_url?: string;
  updated_at?: string;
};

function labelForRun(run: WorkflowRun): DeployRunStatus {
  const url = run.html_url ?? GITHUB_ACTIONS_URL;
  const updatedAt = run.updated_at;

  if (run.status === "in_progress" || run.status === "queued" || run.status === "waiting") {
    return {
      label: run.status === "queued" || run.status === "waiting" ? "Queued" : "Building",
      tone: "warn",
      url,
      updatedAt,
    };
  }

  if (run.conclusion === "success") {
    return { label: "Deployed", tone: "ok", url, updatedAt };
  }
  if (run.conclusion === "failure" || run.conclusion === "cancelled" || run.conclusion === "timed_out") {
    return { label: "Failed", tone: "bad", url, updatedAt };
  }

  return { label: "Deploy", tone: "neutral", url, updatedAt };
}

/** Latest GitHub Pages workflow run (public API, no token). */
export async function fetchLatestDeployStatus(): Promise<DeployRunStatus | null> {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/actions/workflows/deploy-pages.yml/runs?per_page=1`,
      { headers: { Accept: "application/vnd.github+json" } },
    );
    if (!response.ok) return null;
    const data = (await response.json()) as { workflow_runs?: WorkflowRun[] };
    const run = data.workflow_runs?.[0];
    if (!run) return null;
    return labelForRun(run);
  } catch {
    return null;
  }
}
