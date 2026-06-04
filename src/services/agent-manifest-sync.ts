const VITE_API_BASE = typeof window !== "undefined" ? window.location.origin : "http://127.0.0.1:5176";

export type AgentManifestSyncResult = {
  ok: boolean;
  code?: number;
  message?: string;
  stdout?: string;
  stderr?: string;
};

export async function runAgentManifestSync(): Promise<AgentManifestSyncResult> {
  try {
    const response = await fetch(`${VITE_API_BASE}/api/agent/manifest-sync`, {
      method: "POST",
      signal: AbortSignal.timeout(65_000),
    });
    const data = (await response.json()) as AgentManifestSyncResult;
    if (!response.ok) {
      return { ...data, ok: false, message: data.message ?? `HTTP ${response.status}` };
    }
    return data;
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Agent manifest sync failed",
    };
  }
}
