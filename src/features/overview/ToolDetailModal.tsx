import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import type { ResolvedTool } from "../../types";
import { ToolDetailContent } from "./ToolDetailContent";
import hubChangelogRaw from "../../../CHANGELOG.md?raw";

export type ToolDetailModalProps = {
  tool: ResolvedTool | null;
  onClose: () => void;
  onRefreshTool?: (toolId: string) => void;
};

/** Hub: modal gọn — một tool, rộng bằng vùng main System (trừ sidebar gốc). */
export function ToolDetailModal({ tool, onClose, onRefreshTool }: ToolDetailModalProps) {
  useEffect(() => {
    if (!tool) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    document.body.classList.add("hub-modal-open");
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.classList.remove("hub-modal-open");
    };
  }, [tool, onClose]);

  if (!tool) return null;

  return createPortal(
    <div className="modal-backdrop modal-backdrop--tool-detail" role="presentation" onClick={onClose}>
      <div
        className="modal-shell modal-shell--tool-detail"
        role="dialog"
        aria-modal="true"
        aria-label={`${tool.name} details`}
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="modal-close modal-close--tool-detail" onClick={onClose} aria-label="Close">
          <X size={16} />
        </button>
        <div className="modal-shell__scroll">
          <ToolDetailContent
            tool={tool}
            hubChangelogRaw={hubChangelogRaw}
            idPrefix={`m-${tool.id}-`}
            onRefreshTool={onRefreshTool ? () => onRefreshTool(tool.id) : undefined}
          />
        </div>
      </div>
    </div>,
    document.body,
  );
}
