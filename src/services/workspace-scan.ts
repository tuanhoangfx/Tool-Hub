const LAUNCHER_BASE = "http://127.0.0.1:5190";

export type WorkspaceScanResult = {
  ok: boolean;
  code?: number;
  message?: string;
  stdout?: string;
  stderr?: string;
  scan?: WorkspaceScanResult;
  github?: WorkspaceScanResult;
};

async function postLauncher(path: string, timeoutMs: number): Promise<WorkspaceScanResult> {
  try {
    const response = await fetch(`${LAUNCHER_BASE}${path}`, {
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
      message:
        error instanceof Error
          ? `${error.message}. Run Hub dev (launcher port 5190) or pnpm launcher`
          : "Launcher did not respond",
    };
  }
}

export async function runWorkspaceScan(): Promise<WorkspaceScanResult> {
  return postLauncher("/scan-workspace", 125_000);
}

export async function runWorkspaceRefresh(): Promise<WorkspaceScanResult> {
  return postLauncher("/refresh-workspace", 240_000);
}
