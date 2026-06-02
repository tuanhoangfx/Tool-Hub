const LAUNCHER_BASE = "http://127.0.0.1:5190";
const VITE_API_BASE = typeof window !== "undefined" ? window.location.origin : "http://127.0.0.1:5176";

export type WorkspaceScanResult = {
  ok: boolean;
  code?: number;
  message?: string;
  stdout?: string;
  stderr?: string;
  scan?: WorkspaceScanResult;
  github?: WorkspaceScanResult;
};

async function postJson(base: string, path: string, timeoutMs: number): Promise<WorkspaceScanResult> {
  try {
    const response = await fetch(`${base}${path}`, {
      method: "POST",
      signal: AbortSignal.timeout(timeoutMs),
    });
    const data = (await response.json()) as WorkspaceScanResult;
    if (!response.ok) {
      return { ...data, ok: false, message: data.message ?? `HTTP ${response.status}` };
    }
    return data;
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Request failed",
    };
  }
}

async function postWithFallback(path: string, timeoutMs: number): Promise<WorkspaceScanResult> {
  const vite = await postJson(VITE_API_BASE, path, timeoutMs);
  if (vite.ok || !/fetch|Failed|network|ECONNREFUSED|5190/i.test(vite.message ?? "")) {
    return vite;
  }

  const legacyPath = path === "/api/workspace/refresh" ? "/refresh-workspace" : "/scan-workspace";
  const launcher = await postJson(LAUNCHER_BASE, legacyPath, timeoutMs);
  if (launcher.ok) return launcher;

  return {
    ok: false,
    message: `${vite.message ?? "Vite API failed"}. ${launcher.message ?? "Launcher did not respond"}`,
  };
}

export async function runWorkspaceScan(): Promise<WorkspaceScanResult> {
  return postWithFallback("/api/workspace/scan", 125_000);
}

export async function runWorkspaceRefresh(): Promise<WorkspaceScanResult> {
  return postWithFallback("/api/workspace/refresh", 240_000);
}
