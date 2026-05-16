import type { RemoteFileState } from "../types";

export function buildHealthTooltip(files?: RemoteFileState[]) {
  if (!files?.length) {
    return { title: "Files", lines: ["Chưa có dữ liệu file từ GitHub."] };
  }

  const ok = files.filter((f) => f.ok);
  const missing = files.filter((f) => !f.ok);

  const lines = [
    `${ok.length}/${files.length} file public OK`,
    ...ok.slice(0, 6).map((f) => `✓ ${f.path}`),
    ...missing.map((f) => `✗ ${f.path}${f.error ? ` — ${f.error}` : ""}`),
  ];

  return { title: "Remote files", lines };
}

export function buildDriftTooltip(alerts: string[]) {
  if (!alerts.length) {
    return { title: "Version drift", lines: ["Package, manifest, changelog và release đang đồng bộ."] };
  }

  return {
    title: `${alerts.length} drift alert${alerts.length > 1 ? "s" : ""}`,
    lines: alerts,
  };
}
