import { useMemo, useState } from "react";
import { EmptyState } from "../../components/EmptyState";
import { DriftHint } from "../../components/DriftHint";
import { HealthBar } from "../../components/HealthBar";
import { ActivityDots, MaterialIcon, TagRow } from "../../components";
import { StatusBadge } from "../../components/StatusBadge";
import { ToolAvatar } from "../../components/ToolAvatar";
import { useLocalHealth } from "../../hooks";
import { formatDate, freshnessLabel, freshnessLevel } from "../../lib/tooling";
import { fileHealthPercent, statusIcon, toolIconName, toolSvgIcon } from "../../lib/visual";
import type { ResolvedTool } from "../../types";
import { TableView } from "./TableView";
import { DetailModal } from "./DetailModal";

type ViewMode = "grid" | "table";

type StoreTabProps = {
  tools: ResolvedTool[];
  selectedId: string;
  onSelect: (id: string) => void;
  viewMode?: ViewMode;
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

function folderName(path: string) {
  if (!path) return "—";
  const parts = path.split(/[\\/]/);
  return parts[parts.length - 1] || path;
}

export function StoreTab({ tools, selectedId, onSelect, viewMode = "grid" }: StoreTabProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const localUrls = useMemo(() => tools.map((t) => t.localUrl).filter((u): u is string => Boolean(u)), [tools]);
  const { state: healthState, check: recheckHealth } = useLocalHealth(localUrls);

  const copyPath = async (path: string) => {
    if (!path) return;
    try {
      await navigator.clipboard.writeText(path);
      setCopied(path);
      window.setTimeout(() => setCopied(null), 1500);
    } catch {
      // ignore clipboard errors
    }
  };

  const openTool = (id: string) => {
    onSelect(id);
    setModalOpen(true);
  };

  const modalTool = modalOpen ? tools.find((t) => t.id === selectedId) ?? null : null;

  return (
    <section className="library-layout">
      <div className="library-toolbar">
        <button
          type="button"
          className="ghost-btn"
          onClick={() => void recheckHealth()}
          title="Re-check local servers"
        >
          <MaterialIcon name="sensors" size={14} />
          Health check
        </button>
        <span className="health-legend">
          <span className="health-dot online" /> online
          <span className="health-dot offline" /> offline
          <span className="health-dot checking" /> checking
        </span>
      </div>
      <div className="view-fade">
        {viewMode === "grid" ? (
          tools.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="card-grid">
              {tools.map((tool) => {
                const pct = fileHealthPercent(tool.remote?.files);
                const isCopied = copied === tool.localPath;
                const fresh = freshnessLevel(tool.updatedAt);
                return (
                  <article
                    className={`tool-card freshness-${fresh}`}
                    key={tool.id}
                    onClick={() => openTool(tool.id)}
                  >
                    <div className="tool-card-top">
                      <ToolAvatar code={tool.code} iconName={toolIconName(tool)} svgSrc={toolSvgIcon(tool) ?? undefined} size="md" />
                      <div className="tool-card-meta">
                        <StatusBadge icon={statusIcon(tool)} label={statusText(tool)} tone={statusTone(tool)} />
                        <DriftHint alerts={tool.driftAlerts} compact />
                        <span className="code-pill">{tool.code}</span>
                      </div>
                    </div>
                    <h2>{tool.name}</h2>
                    <TagRow tags={tool.tags} limit={3} />
                    <HealthBar percent={pct} files={tool.remote?.files} />
                    {tool.localPath ? (
                      <div className="card-local">
                        <MaterialIcon name="folder" size={13} />
                        <span title={tool.localPath}>{folderName(tool.localPath)}</span>
                      </div>
                    ) : null}
                    <ActivityDots tool={tool} />
                    <div className="card-footer">
                      <span className="mini-stat">
                        <MaterialIcon name="sell" size={14} />
                        v{tool.version}
                      </span>
                      <div className="card-quick-actions" onClick={(e) => e.stopPropagation()}>
                        {tool.deployTarget === "github-release" && tool.repo ? (
                          <a className="icon-link tone-download" href={tool.releaseUrl} target="_blank" rel="noreferrer" title="Download từ GitHub Releases">
                            <MaterialIcon name="download" size={16} />
                          </a>
                        ) : null}
                        {tool.appUrl ? (
                          <a className="icon-link tone-app" href={tool.appUrl} target="_blank" rel="noreferrer" title={`Production: ${tool.appUrl}`}>
                            <MaterialIcon name="public" size={16} />
                          </a>
                        ) : null}
                        {tool.localUrl ? (
                          <a
                            className={`icon-link tone-local health-${healthState[tool.localUrl] ?? "unknown"}`}
                            href={tool.localUrl}
                            target="_blank"
                            rel="noreferrer"
                            title={`Local: ${tool.localUrl} (${healthState[tool.localUrl] ?? "unknown"})`}
                          >
                            <MaterialIcon name="dns" size={16} />
                            <span className="health-dot" />
                          </a>
                        ) : null}
                        {tool.repo ? (
                          <a className="icon-link" href={tool.repoUrl} target="_blank" rel="noreferrer" title={`Repo: ${tool.repo}`}>
                            <MaterialIcon name="hub" size={16} />
                          </a>
                        ) : null}
                        {tool.localPath ? (
                          <button
                            className="icon-link"
                            type="button"
                            onClick={() => void copyPath(tool.localPath)}
                            title={isCopied ? "Đã copy!" : `Copy folder: ${tool.localPath}`}
                          >
                            <MaterialIcon name={isCopied ? "check" : "folder"} size={16} />
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )
        ) : (
          <TableView tools={tools} selectedId={selectedId} onSelect={openTool} onCopyPath={copyPath} />
        )}
      </div>

      <DetailModal tool={modalTool} onClose={() => setModalOpen(false)} onCopyPath={copyPath} copied={copied} />
    </section>
  );
}
