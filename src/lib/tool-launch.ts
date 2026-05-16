import type { ResolvedTool } from "../types";

const LAUNCHER_URL = "http://127.0.0.1:5190";

export function canLaunchTool(tool: ResolvedTool) {
  return Boolean(tool.localPath?.trim());
}

export function launchCommandLabel(tool: ResolvedTool) {
  return tool.remote?.manifest?.commands?.dev ?? (tool.id === "zalo-ai-bot" ? "admin.bat" : "corepack pnpm dev");
}

export async function checkLauncherOnline() {
  try {
    const response = await fetch(`${LAUNCHER_URL}/health`, { cache: "no-store" });
    return response.ok;
  } catch {
    return false;
  }
}

export async function launchTool(toolId: string) {
  try {
    const response = await fetch(`${LAUNCHER_URL}/launch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: toolId }),
    });
    const data = (await response.json()) as { ok?: boolean; message?: string };
    return { ok: Boolean(data.ok), message: data.message ?? (data.ok ? "Đã khởi chạy" : "Launch thất bại") };
  } catch {
    return {
      ok: false,
      message: `Launcher offline. Chạy: cd GitHub-Tool-Manager && pnpm run launcher`,
    };
  }
}

export function folderFileUrl(localPath: string) {
  const normalized = localPath.replace(/\\/g, "/");
  return `file:///${normalized}`;
}
