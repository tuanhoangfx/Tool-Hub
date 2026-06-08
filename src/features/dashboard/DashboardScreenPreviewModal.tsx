import { ArrowUpRight, Star } from "lucide-react";
import {
  HubAppTabGroupBadge,
  HubToolDetailModal,
  HubToolDetailModalPrimaryAction,
  HubToolDetailModalSecondaryAction,
  HubToolDetailSection,
  HubUiTemplateBadge,
} from "@tool-workspace/hub-ui";
import { compactIconSize } from "../../lib/ui-scale";
import { navigateToDashboardTab } from "./dashboard-nav";
import type { DashboardTabEntry } from "./dashboard-tab-registry";
import { DashboardStatusBadge } from "./DashboardStatusBadge";

type DashboardScreenPreviewModalProps = {
  entry: DashboardTabEntry | null;
  pinned: boolean;
  onClose: () => void;
  onTogglePin: (id: string) => void;
};

export function DashboardScreenPreviewModal({
  entry,
  pinned,
  onClose,
  onTogglePin,
}: DashboardScreenPreviewModalProps) {
  if (!entry) return null;
  const Icon = entry.icon;

  return (
    <HubToolDetailModal
      open
      onClose={onClose}
      title={entry.label}
      titleId="dashboard-screen-preview-title"
      headerIcon={Icon}
      headerTrailing={
        <span className="truncate font-mono text-[10px] text-[var(--muted)]">{entry.goldenRef ?? entry.path}</span>
      }
      footer={
        <>
          <HubToolDetailModalSecondaryAction
            label={pinned ? "Unpin" : "Pin"}
            onClick={() => onTogglePin(entry.id)}
          />
          <HubToolDetailModalPrimaryAction
            label="Open screen"
            icon={ArrowUpRight}
            onClick={() => {
              navigateToDashboardTab(entry);
              onClose();
            }}
          />
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <HubAppTabGroupBadge group={entry.group} />
          <HubUiTemplateBadge template={entry.template} />
          {entry.status ? <DashboardStatusBadge status={entry.status} /> : null}
        </div>
        <HubToolDetailSection id="dash-preview-summary" title="Summary">
          <p className="text-sm leading-relaxed text-[var(--muted)]">{entry.description}</p>
          {entry.meta ? <p className="mt-2 text-xs font-medium text-indigo-300/85">{entry.meta}</p> : null}
        </HubToolDetailSection>
        <HubToolDetailSection id="dash-preview-route" title="Route">
          <code className="font-mono text-xs text-[var(--text)]">{entry.path}</code>
        </HubToolDetailSection>
        {entry.goldenRef ? (
          <HubToolDetailSection id="dash-preview-golden" title="Golden">
            <code className="font-mono text-xs text-emerald-200/90">{entry.goldenRef}</code>
            {entry.goldenScreenPath ? (
              <p className="mt-1 font-mono text-[10px] text-[var(--muted)]">{entry.goldenScreenPath}</p>
            ) : null}
          </HubToolDetailSection>
        ) : null}
      </div>
    </HubToolDetailModal>
  );
}
