import { EmptyState } from "../../components/EmptyState";
import { DriftHint } from "../../components/DriftHint";
import { HealthBar } from "../../components/HealthBar";
import { InfoItem } from "../../components/InfoItem";
import { MaterialIcon, TagRow } from "../../components";
import { StatusBadge } from "../../components/StatusBadge";
import { ToolAvatar } from "../../components/ToolAvatar";
import { formatDate } from "../../lib/tooling";
import { fileHealthPercent, statusIcon, toolIconName } from "../../lib/visual";
import type { ResolvedTool } from "../../types";

type StoreTabProps = {
  tools: ResolvedTool[];
  selectedId: string;
  onSelect: (id: string) => void;
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

export function StoreTab({ tools, selectedId, onSelect }: StoreTabProps) {
  const selectedTool = tools.find((tool) => tool.id === selectedId) ?? tools[0];

  return (
    <section className="store-layout">
      <div className="card-grid">
        {tools.map((tool) => {
          const pct = fileHealthPercent(tool.remote?.files);
          const selected = tool.id === selectedId;

          return (
            <article className={selected ? "tool-card selected" : "tool-card"} key={tool.id} onClick={() => onSelect(tool.id)}>
              <div className="tool-card-top">
                <ToolAvatar code={tool.code} iconName={toolIconName(tool)} size="md" />
                <div className="tool-card-meta">
                  <StatusBadge icon={statusIcon(tool)} label={statusText(tool)} tone={statusTone(tool)} />
                  <DriftHint alerts={tool.driftAlerts} compact />
                  <span className="code-pill">{tool.code}</span>
                </div>
              </div>
              <h2>{tool.name}</h2>
              <TagRow tags={tool.tags} limit={3} />
              <HealthBar percent={pct} files={tool.remote?.files} />
              <div className="card-footer">
                <span className="mini-stat">
                  <MaterialIcon name="sell" size={14} />
                  v{tool.version}
                </span>
                <MaterialIcon name="arrow_forward" size={18} className="card-arrow" />
              </div>
            </article>
          );
        })}
      </div>

      {selectedTool ? (
        <aside className="detail-panel detail-panel-rich">
          <div className="detail-hero">
            <ToolAvatar code={selectedTool.code} iconName={toolIconName(selectedTool)} size="lg" />
            <div>
              <h2>{selectedTool.name}</h2>
              <StatusBadge icon={statusIcon(selectedTool)} label={statusText(selectedTool)} tone={statusTone(selectedTool)} />
            </div>
          </div>

          <p className="detail-summary">{selectedTool.summary}</p>

          {selectedTool.tags.length > 0 ? (
            <section className="detail-tags">
              <h3 className="detail-tags-label">Tech stack</h3>
              <TagRow tags={selectedTool.tags} iconSize={14} />
            </section>
          ) : null}

          <div className="action-row">
            {selectedTool.appUrl ? (
              <a className="btn primary wide" href={selectedTool.appUrl} target="_blank" rel="noreferrer">
                <MaterialIcon name="launch" size={18} />
                Mở app
              </a>
            ) : (
              <a className="btn primary wide" href={selectedTool.downloadUrl} target="_blank" rel="noreferrer">
                <MaterialIcon name="download" size={18} />
                Tải về
              </a>
            )}
            <a
              className="btn secondary"
              href={selectedTool.appUrl ? selectedTool.downloadUrl : selectedTool.repoUrl}
              target="_blank"
              rel="noreferrer"
              title={selectedTool.appUrl ? "Tải về / release" : "Mở repo GitHub"}
            >
              <MaterialIcon name={selectedTool.appUrl ? "download" : "open_in_new"} size={18} />
            </a>
            {selectedTool.appUrl ? (
              <a className="btn secondary" href={selectedTool.repoUrl} target="_blank" rel="noreferrer" title="Mở repo GitHub">
                <MaterialIcon name="open_in_new" size={18} />
              </a>
            ) : null}
          </div>

          <HealthBar percent={fileHealthPercent(selectedTool.remote?.files)} files={selectedTool.remote?.files} />

          <section className="info-grid">
            <InfoItem icon="category" label="Loại" value={selectedTool.category} />
            <InfoItem icon="folder" label="Repo" value={selectedTool.repo} />
            <InfoItem icon="update" label="Cập nhật" value={formatDate(selectedTool.updatedAt)} />
            <InfoItem icon="groups" label="Đối tượng" value={selectedTool.audience} />
          </section>
        </aside>
      ) : (
        <EmptyState />
      )}
    </section>
  );
}
