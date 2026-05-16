import type { MouseEvent } from "react";
import { useEffect, useState } from "react";
import { FileListBlock } from "../../components/FileListBlock";
import { DriftHint } from "../../components/DriftHint";
import { HealthBar } from "../../components/HealthBar";
import { InfoItem } from "../../components/InfoItem";
import { MaterialIcon } from "../../components/MaterialIcon";
import { StatusBadge } from "../../components/StatusBadge";
import { ToolAvatar } from "../../components/ToolAvatar";
import { formatDate } from "../../lib/tooling";
import {
  canLaunchTool,
  fetchLauncherHealth,
  folderFileUrl,
  formatRunningTools,
  LAUNCHER_HTTPS_HINT,
  LAUNCHER_SETUP_HINT,
  launchCommandLabel,
  launchTool,
  openLauncherPage,
  type LauncherHealth,
} from "../../lib/tool-launch";
import { fileHealthPercent, statusIcon, toolIconName } from "../../lib/visual";
import type { ResolvedTool, ToolRepository } from "../../types";

type AdminTabProps = {
  tools: ResolvedTool[];
  allTools: ToolRepository[];
  selectedTool: ResolvedTool;
  onRefresh: (tool: ToolRepository) => Promise<void>;
  onSelect: (id: string) => void;
  onRemoveCustom: (id: string) => void;
};

function statusTone(tool: ResolvedTool): "ok" | "warn" | "bad" | "neutral" {
  if (tool.remoteEnabled === false) return "neutral";
  if (tool.healthLabel === "Ready") return "ok";
  if (tool.driftAlerts.length > 0) return "bad";
  return "warn";
}

function statusText(tool: ResolvedTool) {
  if (tool.remoteEnabled === false) return "Local";
  return tool.healthLabel;
}

export function AdminTab({ tools, allTools, selectedTool, onRefresh, onSelect, onRemoveCustom }: AdminTabProps) {
  const selectedBase = allTools.find((tool) => tool.id === selectedTool.id) ?? selectedTool;
  const manifest = selectedTool.remote?.manifest;
  const files = selectedTool.remote?.files ?? [];
  const scripts = files.filter((file) => selectedTool.scriptFiles.includes(file.path));
  const custom = selectedTool.code === "CUSTOM";
  const selectedPct = fileHealthPercent(files);
  const [launchStatus, setLaunchStatus] = useState("");
  const [launchingId, setLaunchingId] = useState<string | null>(null);
  const [launcherHealth, setLauncherHealth] = useState<LauncherHealth | null>(null);
  const selectedLaunchable = canLaunchTool(selectedTool);
  const onHttps = typeof window !== "undefined" && window.location.protocol === "https:";
  const launcherOnline = onHttps ? null : launcherHealth?.ok === true;
  const runningLabel = formatRunningTools(launcherHealth?.running);

  useEffect(() => {
    if (onHttps) {
      setLauncherHealth(null);
      return;
    }
    let cancelled = false;
    const tick = async () => {
      const health = await fetchLauncherHealth();
      if (!cancelled) setLauncherHealth(health);
    };
    void tick();
    const timer = window.setInterval(() => void tick(), 10000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [onHttps]);

  function launcherBarLabel() {
    if (onHttps) return "Launcher local — không kiểm tra được từ HTTPS";
    if (launcherHealth === null) return "Đang kiểm tra launcher…";
    if (!launcherHealth.ok) return `Launcher offline — ${LAUNCHER_SETUP_HINT}`;
    if (runningLabel) return `Launcher online · đang chạy: ${runningLabel}`;
    return "Launcher online · chưa có tool nào chạy";
  }

  function handleOpenLauncher() {
    openLauncherPage();
    setLaunchStatus(onHttps ? `Đã mở tab launcher. ${LAUNCHER_HTTPS_HINT}` : "Đã mở trang launcher.");
    window.setTimeout(() => setLaunchStatus(""), 8000);
  }

  async function handleLaunch(tool: ResolvedTool, event?: MouseEvent) {
    event?.stopPropagation();
    if (!canLaunchTool(tool)) return;
    setLaunchingId(tool.id);
    setLaunchStatus("");
    const result = await launchTool(tool.id);
    setLaunchStatus(result.message);
    setLaunchingId(null);
    window.setTimeout(() => setLaunchStatus(""), 5000);
  }

  return (
    <section className="admin-layout">
      <div className="admin-main admin-cards-area">
        {onHttps ? (
          <div className="inline-banner warn launcher-https-hint">
            <MaterialIcon name="info" size={16} />
            <span>{LAUNCHER_HTTPS_HINT}</span>
          </div>
        ) : null}
        <div className="launcher-bar">
          <span className={launcherOnline === true ? "dot live" : launcherOnline === false ? "dot bad" : "dot"} />
          <span className="launcher-bar-label">{launcherBarLabel()}</span>
          {!onHttps && launcherHealth?.running?.length ? (
            <div className="launcher-running-chips" aria-label="Tools đang chạy">
              {launcherHealth.running.map((item) =>
                item.devUrl ? (
                  <a
                    className="launcher-chip link"
                    key={item.id}
                    href={item.devUrl}
                    target="_blank"
                    rel="noreferrer"
                    title={`Mở ${item.devUrl}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {item.id}
                  </a>
                ) : (
                  <span className="launcher-chip" key={item.id}>
                    {item.id}
                  </span>
                ),
              )}
            </div>
          ) : null}
          <button className="btn secondary" type="button" onClick={handleOpenLauncher}>
            <MaterialIcon name="open_in_new" size={16} />
            Mở launcher
          </button>
        </div>
        {launchStatus ? <div className="inline-banner ok">{launchStatus}</div> : null}

        <div className="provider-grid">
          {tools.map((tool) => {
            const pct = fileHealthPercent(tool.remote?.files);
            const tone = statusTone(tool);
            const selected = tool.id === selectedTool.id;
            const launchable = canLaunchTool(tool);

            return (
              <article
                className={selected ? "provider-card selected" : "provider-card"}
                key={tool.id}
                onClick={() => onSelect(tool.id)}
              >
                <div className="provider-card-head">
                  <ToolAvatar code={tool.code} iconName={toolIconName(tool)} size="md" />
                  <div className="provider-card-title">
                    <h3>{tool.name}</h3>
                    <a className="repo-link" href={tool.repoUrl} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
                      <MaterialIcon name="link" size={14} />
                      {tool.repo}
                    </a>
                  </div>
                  <div className="provider-card-actions">
                    {launchable ? (
                      <button
                        className="icon-button run"
                        type="button"
                        title={`Chạy: ${launchCommandLabel(tool)}`}
                        disabled={launchingId === tool.id}
                        onClick={(e) => void handleLaunch(tool, e)}
                      >
                        <MaterialIcon name="play_arrow" size={16} className={launchingId === tool.id ? "spin" : ""} />
                      </button>
                    ) : null}
                    <button
                      className="icon-button"
                      type="button"
                      title="Refresh"
                      onClick={(e) => {
                        e.stopPropagation();
                        void onRefresh(tool);
                      }}
                    >
                      <MaterialIcon name="refresh" size={16} />
                    </button>
                    <StatusBadge icon={statusIcon(tool)} label={statusText(tool)} tone={tone} />
                  </div>
                </div>

                <div className="provider-card-body">
                  <div className="mini-stat-row">
                    <span className="mini-stat">
                      <MaterialIcon name="sell" size={15} />
                      v{tool.version}
                    </span>
                    <span className="mini-stat">
                      <MaterialIcon name={tool.remote?.latestRelease ? "new_releases" : "block"} size={15} />
                      {tool.remote?.latestRelease ? "Release" : "No rel"}
                    </span>
                    <DriftHint alerts={tool.driftAlerts} />
                  </div>
                  <HealthBar percent={pct} files={tool.remote?.files} />
                </div>
              </article>
            );
          })}
        </div>
      </div>

      <aside className="admin-side detail-panel-rich">
        <div className="detail-hero">
          <ToolAvatar code={selectedTool.code} iconName={toolIconName(selectedTool)} size="lg" />
          <div>
            <h2>{selectedTool.name}</h2>
            <StatusBadge icon={statusIcon(selectedTool)} label={statusText(selectedTool)} tone={statusTone(selectedTool)} />
          </div>
          <span className="version-chip">v{selectedTool.version}</span>
        </div>

        <HealthBar percent={selectedPct} files={files} />

        <div className="info-grid">
          <InfoItem icon="call_split" label="Branch" value={selectedTool.branch} />
          <InfoItem icon="schedule" label="Checked" value={formatDate(selectedTool.remote?.checkedAt)} />
          <InfoItem icon="category" label="Category" value={selectedTool.category} />
          <InfoItem icon="groups" label="Audience" value={selectedTool.audience} />
        </div>

        <FileListBlock title="Files" iconName="description" files={files} />
        <FileListBlock title="Scripts" iconName="code" files={scripts} empty="—" />

        {selectedTool.suggestions.length > 0 ? (
          <section className="info-block tip-block">
            <h3>
              <MaterialIcon name="lightbulb" size={16} />
              Gợi ý
            </h3>
            <ul className="suggestions">
              {selectedTool.suggestions.slice(0, 4).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        ) : null}

        {manifest?.nextActions?.length ? (
          <section className="info-block tip-block">
            <h3>
              <MaterialIcon name="playlist_add_check" size={16} />
              Next
            </h3>
            <ul className="suggestions">
              {manifest.nextActions.slice(0, 3).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        ) : null}

        <div className="action-row">
          {selectedLaunchable ? (
            <button className="btn primary wide" type="button" disabled={launchingId === selectedTool.id} onClick={() => void handleLaunch(selectedTool)}>
              <MaterialIcon name="play_arrow" size={16} className={launchingId === selectedTool.id ? "spin" : ""} />
              Chạy tool
            </button>
          ) : null}
          {selectedTool.localPath ? (
            <a className="btn secondary" href={folderFileUrl(selectedTool.localPath)} title="Mở thư mục local">
              <MaterialIcon name="folder_open" size={16} />
            </a>
          ) : null}
          <a className="btn secondary" href={selectedTool.repoUrl} target="_blank" rel="noreferrer" title="GitHub">
            <MaterialIcon name="open_in_new" size={16} />
          </a>
          <button className="btn secondary" type="button" onClick={() => void onRefresh(selectedBase)} title="Refresh metadata">
            <MaterialIcon name="refresh" size={16} />
          </button>
        </div>
        {selectedLaunchable ? (
          <p className="muted-inline launch-hint">
            Local: chạy <code>dev.bat</code> (launcher + UI). Production: <code>launch.bat</code> rồi dùng infix1.io.vn.
            Lệnh: {launchCommandLabel(selectedTool)}.
          </p>
        ) : null}

        {custom ? (
          <button className="danger-action" type="button" onClick={() => onRemoveCustom(selectedTool.id)}>
            <MaterialIcon name="delete" size={16} />
            Xóa repo
          </button>
        ) : null}
      </aside>
    </section>
  );
}
