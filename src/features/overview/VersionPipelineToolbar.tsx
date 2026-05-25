import { useCallback, useEffect, useState } from "react";
import { FileJson, GitCommit, Loader2, RefreshCw, UploadCloud } from "lucide-react";
import {
  fetchLauncherOnline,
  runVersionPipeline,
  type VersionPipelineAction,
  type VersionPipelineResult,
} from "../../services/version-pipeline";
import type { ToolVersionHistoryRow } from "./tool-versions";
import { versionChecklist } from "./version-checklist";

const BTNS: {
  action: VersionPipelineAction;
  label: string;
  icon: typeof RefreshCw;
  title: string;
}[] = [
  {
    action: "sync",
    label: "Đồng bộ",
    icon: FileJson,
    title: "Giữ version hiện tại — chỉ khớp package.json + tool.manifest.json",
  },
  {
    action: "commit",
    label: "Commit",
    icon: GitCommit,
    title: "Tăng patch (0.1.0→0.1.1) + CHANGELOG + manifest + package, rồi git commit",
  },
  {
    action: "push",
    label: "Push",
    icon: UploadCloud,
    title: "git push origin + tag v{version}",
  },
];

export function VersionPipelineToolbar({
  toolCode,
  localPath,
  branch,
  currentRow,
  remoteEnabled,
  onDone,
}: {
  toolCode: string;
  localPath?: string;
  branch?: string;
  currentRow?: ToolVersionHistoryRow;
  remoteEnabled?: boolean;
  onDone?: () => void;
}) {
  const [launcherOk, setLauncherOk] = useState<boolean | null>(null);
  const [busy, setBusy] = useState<VersionPipelineAction | null>(null);
  const [lastResult, setLastResult] = useState<VersionPipelineResult | null>(null);
  const [commitTitle, setCommitTitle] = useState("");

  const checkLauncher = useCallback(async () => {
    setLauncherOk(await fetchLauncherOnline());
  }, []);

  useEffect(() => {
    void checkLauncher();
  }, [checkLauncher]);

  const canRun = Boolean(localPath?.trim()) && launcherOk && !busy && currentRow?.isCurrent;

  async function run(action: VersionPipelineAction) {
    if (!localPath || !currentRow) return;
    setBusy(action);
    setLastResult(null);
    const bumpOnCommit = action === "commit" || action === "all";
    const result = await runVersionPipeline({
      cwd: localPath,
      version: currentRow.version,
      branch: branch ?? "main",
      action,
      bumpOnCommit,
      commitTitle: commitTitle.trim() || undefined,
    });
    setLastResult(result);
    setBusy(null);
    if (result.ok) onDone?.();
  }

  if (!currentRow?.isCurrent) return null;

  const checklist = versionChecklist(currentRow);
  const missing = checklist.filter((c) => !c.done);

  const nextPatch = (() => {
    const m = currentRow.version.match(/^(\d+)\.(\d+)\.(\d+)$/);
    if (!m) return "?";
    return `${m[1]}.${m[2]}.${Number(m[3]) + 1}`;
  })();

  return (
    <div className="rounded-lg border border-indigo-500/25 bg-indigo-500/[.06] px-3 py-2.5 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-medium text-indigo-200">
          Pipeline · <span className="font-mono">{currentRow.display}</span>
          <span className="text-[var(--muted)]"> ({toolCode})</span>
        </span>
        <span className="text-[10px] text-cyan-200/80">
          Commit/Tất cả → <span className="font-mono">v{nextPatch}</span> + đồng bộ docs
        </span>
        {launcherOk === false ? (
          <span className="text-[10px] text-amber-200/90">
            Launcher offline — <code className="rounded bg-black/30 px-1">pnpm dev</code> hoặc{" "}
            <code className="rounded bg-black/30 px-1">pnpm launcher</code>
          </span>
        ) : null}
        <div className="ml-auto flex flex-wrap items-center gap-1.5">
          <input
            type="text"
            value={commitTitle}
            onChange={(e) => setCommitTitle(e.target.value)}
            placeholder="Tiêu đề CHANGELOG (tuỳ chọn)"
            className="w-40 rounded-lg border border-white/10 bg-black/20 px-2 py-1.5 text-[10px] text-[var(--text)] placeholder:text-[var(--muted)] sm:w-52"
            disabled={!canRun}
          />
          {BTNS.map(({ action, label, icon: Icon, title }) => (
            <button
              key={action}
              type="button"
              disabled={!canRun || remoteEnabled === false}
              title={
                remoteEnabled === false
                  ? "Tool local-only — bật remote/GitHub trước"
                  : !localPath
                    ? "Thiếu localPath"
                    : title
              }
              onClick={() => void run(action)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-[var(--panel-2)] px-2.5 py-1.5 text-[11px] font-medium text-[var(--text)] hover:bg-white/5 disabled:opacity-40"
            >
              {busy === action ? (
                <Loader2 size={12} className="anim-spin" aria-hidden />
              ) : (
                <Icon size={12} className="text-indigo-300" aria-hidden />
              )}
              {label}
            </button>
          ))}
          <button
            type="button"
            disabled={!canRun}
            title="Bump patch → commit → push (+ tag)"
            onClick={() => void run("all")}
            className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-400/35 bg-indigo-500/15 px-2.5 py-1.5 text-[11px] font-semibold text-indigo-100 hover:bg-indigo-500/25 disabled:opacity-40"
          >
            {busy === "all" ? <Loader2 size={12} className="anim-spin" /> : <RefreshCw size={12} />}
            Tất cả
          </button>
        </div>
      </div>
      {missing.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 text-[10px]">
          <span className="text-[var(--muted)]">Còn thiếu:</span>
          {missing.map((m) => (
            <span
              key={m.key}
              className="rounded border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-amber-200/90"
            >
              {m.label}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-[10px] text-emerald-300/90">Checklist pipeline đủ cho bản hiện tại.</p>
      )}
      {lastResult ? (
        <ul className="space-y-0.5 text-[10px] leading-snug">
          {lastResult.version ? (
            <li className="text-indigo-200/90">
              Version sau pipeline: <span className="font-mono">v{lastResult.version}</span>
            </li>
          ) : null}
          {lastResult.steps.map((s) => (
            <li key={`${s.step}-${s.detail}`} className={s.ok ? "text-emerald-300/90" : "text-rose-300/90"}>
              <strong className="uppercase">{s.step}</strong>: {s.detail}
            </li>
          ))}
          {lastResult.message ? <li className="text-rose-300/90">{lastResult.message}</li> : null}
        </ul>
      ) : null}
    </div>
  );
}
