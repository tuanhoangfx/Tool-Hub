import { FileListBlock } from "../../components/FileListBlock";
import { DriftHint } from "../../components/DriftHint";
import { HealthBar } from "../../components/HealthBar";
import { InfoItem } from "../../components/InfoItem";
import { MaterialIcon } from "../../components/MaterialIcon";
import { StatusBadge } from "../../components/StatusBadge";
import { ToolAvatar } from "../../components/ToolAvatar";
import { formatDate } from "../../lib/tooling";
import { fileHealthPercent, statusIcon, toolIconName } from "../../lib/visual";
import type { ResolvedTool, ToolRepository } from "../../types";

type AdminTabProps = {
  tools: ResolvedTool[];
  allTools: ToolRepository[];
  selectedTool: ResolvedTool;
  repoDraft: string;
  onRepoDraftChange: (value: string) => void;
  onAddRepo: () => void;
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

export function AdminTab({
  tools,
  allTools,
  selectedTool,
  repoDraft,
  onRepoDraftChange,
  onAddRepo,
  onRefresh,
  onSelect,
  onRemoveCustom,
}: AdminTabProps) {
  const selectedBase = allTools.find((tool) => tool.id === selectedTool.id) ?? selectedTool;
  const manifest = selectedTool.remote?.manifest;
  const files = selectedTool.remote?.files ?? [];
  const scripts = files.filter((file) => selectedTool.scriptFiles.includes(file.path));
  const custom = selectedTool.code === "CUSTOM";
  const selectedPct = fileHealthPercent(files);

  return (
    <section className="admin-layout">
      <div className="admin-main admin-cards-area">
        <div className="toolbar-card">
          <MaterialIcon name="add_link" size={20} className="toolbar-card-icon" />
          <input
            value={repoDraft}
            onChange={(e) => onRepoDraftChange(e.target.value)}
            placeholder="owner/repo hoặc URL GitHub"
          />
          <button className="btn primary" type="button" onClick={onAddRepo}>
            <MaterialIcon name="add" size={18} />
            Thêm
          </button>
        </div>

        <div className="provider-grid">
          {tools.map((tool) => {
            const pct = fileHealthPercent(tool.remote?.files);
            const tone = statusTone(tool);
            const selected = tool.id === selectedTool.id;

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
          <a className="btn secondary wide" href={selectedTool.repoUrl} target="_blank" rel="noreferrer">
            <MaterialIcon name="open_in_new" size={16} />
            GitHub
          </a>
          <button className="btn secondary" type="button" onClick={() => void onRefresh(selectedBase)}>
            <MaterialIcon name="refresh" size={16} />
          </button>
        </div>

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
