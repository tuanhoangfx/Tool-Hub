const LAUNCHER_BASE = "http://127.0.0.1:5190";

export type WorkspaceScanResult = {
  ok: boolean;
  code?: number;
  message?: string;
  stdout?: string;
  stderr?: string;
};

export async function runWorkspaceScan(): Promise<WorkspaceScanResult> {
  try {
    const response = await fetch(`${LAUNCHER_BASE}/scan-workspace`, {
      method: "POST",
      signal: AbortSignal.timeout(125_000),
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
