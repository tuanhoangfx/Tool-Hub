import type { ResolvedTool } from "../types";

export const LAUNCHER_URL = "http://127.0.0.1:5190";

export const LAUNCHER_SETUP_HINT =
  "Chạy launch.bat hoặc dev.bat trong thư mục GitHub-Tool-Manager (E:\\Dev\\Tool\\GitHub-Tool-Manager), giữ cửa sổ mở, rồi thử lại.";

export const LAUNCHER_HTTPS_HINT =
  "Từ infix1.io.vn, trình duyệt không gọi được localhost. Bấm Chạy tool → tab mở http://127.0.0.1:5190 — nếu trang trắng/lỗi, chạy launch.bat trước.";

export type LauncherRunning = { id: string; pid: number; devUrl?: string | null };

export type LauncherHealth = {
  ok: boolean;
  port?: number;
  configured?: string[];
  running?: LauncherRunning[];
};

export function launcherHomeUrl() {
  return `${LAUNCHER_URL}/`;
}

export function openLauncherPage() {
  window.open(launcherHomeUrl(), "_blank", "noopener,noreferrer");
}

export function canLaunchTool(tool: ResolvedTool) {
  return Boolean(tool.localPath?.trim());
}

export function launchCommandLabel(tool: ResolvedTool) {
  return tool.remote?.manifest?.commands?.dev ?? (tool.id === "zalo-ai-bot" ? "admin.bat" : "corepack pnpm dev");
}

export function launcherLaunchPageUrl(toolId: string) {
  return `${LAUNCHER_URL}/launch?id=${encodeURIComponent(toolId)}`;
}

function isHttpsPage() {
  return typeof window !== "undefined" && window.location.protocol === "https:";
}

export async function fetchLauncherHealth(): Promise<LauncherHealth | null> {
  if (isHttpsPage()) return null;
  try {
    const response = await fetch(`${LAUNCHER_URL}/health`, { cache: "no-store" });
    if (!response.ok) return null;
    return (await response.json()) as LauncherHealth;
  } catch {
    return null;
  }
}

export async function checkLauncherOnline() {
  const health = await fetchLauncherHealth();
  if (health === null && isHttpsPage()) return null;
  return health?.ok === true;
}

export function formatRunningTools(running: LauncherRunning[] | undefined) {
  if (!running?.length) return "";
  return running
    .map((item) => {
      const port = item.devUrl ? ` → ${item.devUrl}` : "";
      return `${item.id} (PID ${item.pid})${port}`;
    })
    .join(", ");
}

export function toolDevUrlFromHealth(toolId: string, running: LauncherRunning[] | undefined) {
  return running?.find((item) => item.id === toolId)?.devUrl ?? null;
}

/** Launch tool via local launcher (works from https://infix1.io.vn by opening a tab). */
export async function launchTool(toolId: string) {
  if (isHttpsPage()) {
    window.open(launcherLaunchPageUrl(toolId), "_blank", "noopener,noreferrer");
    return {
      ok: true,
      message: `Đã mở tab launcher cho ${toolId}. ${LAUNCHER_HTTPS_HINT}`,
    };
  }

  const health = await fetchLauncherHealth();
  if (!health?.ok) {
    return {
      ok: false,
      message: `Launcher chưa chạy. ${LAUNCHER_SETUP_HINT}`,
    };
  }

  try {
    const response = await fetch(`${LAUNCHER_URL}/launch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: toolId }),
    });
    const data = (await response.json()) as { ok?: boolean; message?: string };
    const plain = (data.message ?? "").replace(/<[^>]+>/g, "");
    return { ok: Boolean(data.ok), message: plain || (data.ok ? "Đã khởi chạy" : "Launch thất bại") };
  } catch {
    window.open(launcherLaunchPageUrl(toolId), "_blank", "noopener,noreferrer");
    return { ok: true, message: `Đã mở tab launcher. ${LAUNCHER_SETUP_HINT}` };
  }
}

export function folderFileUrl(localPath: string) {
  const normalized = localPath.replace(/\\/g, "/");
  return `file:///${normalized}`;
}
