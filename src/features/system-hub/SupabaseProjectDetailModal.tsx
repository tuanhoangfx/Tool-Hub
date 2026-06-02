import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { compactIconSize } from "../../lib/ui-scale";
import type { OrgRow, ProjectRow } from "./SystemSupabaseQuotaPanel.types";
import { SupabaseProjectDetailContent } from "./SupabaseProjectDetailContent";

export type SupabaseProjectDetailModalProps = {
  project: ProjectRow | null;
  org: OrgRow | null;
  tools?: string[];
  onClose: () => void;
};

/** Hub-style modal for one Supabase project (same shell classes as ToolDetailModal). */
export function SupabaseProjectDetailModal({ project, org, tools = [], onClose }: SupabaseProjectDetailModalProps) {
  useEffect(() => {
    if (!project) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    document.body.classList.add("hub-modal-open");
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.classList.remove("hub-modal-open");
    };
  }, [project, onClose]);

  if (!project) return null;

  return createPortal(
    <div className="modal-backdrop modal-backdrop--tool-detail" role="presentation" onClick={onClose}>
      <div
        className="modal-shell modal-shell--tool-detail"
        role="dialog"
        aria-modal="true"
        aria-label={`${project.projectName} details`}
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="modal-close modal-close--tool-detail" onClick={onClose} aria-label="Close">
          <X size={compactIconSize(16)} />
        </button>
        <div className="modal-shell__scroll">
          <SupabaseProjectDetailContent
            project={project}
            org={org}
            tools={tools}
            idPrefix={`sq-${project.projectRef}-`}
          />
        </div>
      </div>
    </div>,
    document.body,
  );
}
