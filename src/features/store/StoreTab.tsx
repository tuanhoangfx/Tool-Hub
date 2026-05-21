import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "../../components/EmptyState";
import { MaterialIcon } from "../../components";
import { useLocalHealth } from "../../hooks";
import type { ResolvedTool } from "../../types";
import { DetailModal } from "./DetailModal";
import { TableView } from "./TableView";
import { ToolCard } from "./ToolCard";

type ViewMode = "grid" | "table";

type StoreTabProps = {
  tools: ResolvedTool[];
  selectedId: string;
  onSelect: (id: string) => void;
  viewMode?: ViewMode;
  modalOpen?: boolean;
  onCloseModal?: () => void;
};

export function StoreTab({
  tools,
  selectedId,
  onSelect,
  viewMode = "grid",
  modalOpen = false,
  onCloseModal,
}: StoreTabProps) {
  const [copied, setCopied] = useState<string | null>(null);

  const localUrls = useMemo(() => tools.map((t) => t.localUrl).filter((u): u is string => Boolean(u)), [tools]);
  const { state: healthState, check: recheckHealth } = useLocalHealth(localUrls);

  // Auto-poll local servers every 60s so the running badge stays accurate when
  // the user starts/stops dev servers without manually clicking Health check.
  useEffect(() => {
    if (localUrls.length === 0) return;
    const timer = window.setInterval(() => void recheckHealth(), 60_000);
    return () => window.clearInterval(timer);
  }, [localUrls, recheckHealth]);

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
  };

  const modalTool = modalOpen ? tools.find((t) => t.id === selectedId) ?? null : null;

  return (
    <section className="library-layout">
      <div className="library-toolbar">
        <button
          type="button"
          className="ghost-btn"
          onClick={() => void recheckHealth()}
          aria-label="Re-check local servers"
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
              {tools.map((tool) => (
                <ToolCard
                  key={tool.id}
                  tool={tool}
                  healthState={tool.localUrl ? healthState[tool.localUrl] : undefined}
                  copied={copied === tool.localPath}
                  onOpen={openTool}
                  onCopyPath={copyPath}
                />
              ))}
            </div>
          )
        ) : (
          <TableView tools={tools} selectedId={selectedId} onSelect={openTool} onCopyPath={copyPath} healthState={healthState} />
        )}
      </div>

      <DetailModal tool={modalTool} onClose={() => onCloseModal?.()} onCopyPath={copyPath} copied={copied} />
    </section>
  );
}
