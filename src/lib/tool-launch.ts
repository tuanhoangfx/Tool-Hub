import type { ResolvedTool } from "../types";

const LAUNCHER_URL = "http://127.0.0.1:5190";

export function canLaunchTool(tool: ResolvedTool) {
  return Boolean(tool.localPath?.trim());
}

export function launchCommandLabel(tool: ResolvedTool) {
  return tool.remote?.manifest?.commands?.dev ?? (tool.id === "zalo-ai-bot" ? "admin.bat" : "corepack pnpm dev");
}

export function launcherLaunchPageUrl(toolId: string) {
  return `${LAUNCHER_URL}/launch?id=${encodeURIComponent(toolId)}`;
}

export async function checkLauncherOnline() {
  if (isHttpsPage()) {
    return null;
  }
  try {
    const response = await fetch(`${LAUNCHER_URL}/health`, { cache: "no-store" });
    return response.ok;
  } catch {
    return false;
  }
}

function isHttpsPage() {
  return typeof window !== "undefined" && window.location.protocol === "https:";
}

/** Launch tool via local launcher (works from https://infix1.io.vn by opening a tab). */
export async function launchTool(toolId: string) {
  if (isHttpsPage()) {
    window.open(launcherLaunchPageUrl(toolId), "_blank", "noopener,noreferrer");
    return {
      ok: true,
      message:
        "Đã mở tab launcher. Nếu trang không tải được, chạy E:\\Dev\\Tool\\GitHub-Tool-Manager\\launch.bat trước, rồi bấm Chạy lại.",
    };
  }

  const online = await checkLauncherOnline();
  if (online === false) {
    return {
      ok: false,
      message:
        "Launcher chưa chạy. Mở launch.bat hoặc dev.bat trong GitHub-Tool-Manager, giữ cửa sổ mở, rồi thử lại.",
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
    return { ok: true, message: "Đã mở tab launcher để chạy tool." };
  }
}

export function folderFileUrl(localPath: string) {
  const normalized = localPath.replace(/\\/g, "/");
  return `file:///${normalized}`;
}
