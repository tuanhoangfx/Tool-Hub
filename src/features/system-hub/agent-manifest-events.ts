/** Sidebar Refresh → rebuild agent-manifest.json then reload Agent tab. */
export const AGENT_MANIFEST_REFRESH_EVENT = "tool-hub:agent-manifest-refresh";

export function dispatchAgentManifestRefresh() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(AGENT_MANIFEST_REFRESH_EVENT));
}
