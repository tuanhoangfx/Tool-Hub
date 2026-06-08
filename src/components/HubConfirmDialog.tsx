import { type ReactNode } from "react";
import { AlertTriangle, type LucideIcon } from "lucide-react";
import {
  HubToolDetailModal,
  HubToolDetailModalPrimaryAction,
  HubToolDetailModalSecondaryAction,
} from "@tool-workspace/hub-ui";

export type HubConfirmTone = "danger" | "warning" | "info";

type Props = {
  open: boolean;
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: HubConfirmTone;
  icon?: LucideIcon;
  confirmBusy?: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

const toneIconClass: Record<HubConfirmTone, string> = {
  danger: "text-rose-300",
  warning: "text-amber-300",
  info: "text-indigo-300",
};

export function HubConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "danger",
  icon: Icon = AlertTriangle,
  confirmBusy = false,
  onConfirm,
  onClose,
}: Props) {
  return (
    <HubToolDetailModal
      open={open}
      onClose={onClose}
      title={title}
      titleId="hub-confirm-title"
      headerIcon={Icon}
      headerIconClassName={toneIconClass[tone]}
      ariaLabelledBy="hub-confirm-title"
      footer={
        <>
          <HubToolDetailModalSecondaryAction label={cancelLabel} onClick={onClose} disabled={confirmBusy} />
          <HubToolDetailModalPrimaryAction
            label={confirmLabel}
            onClick={onConfirm}
            disabled={confirmBusy}
            busy={confirmBusy}
            danger={tone === "danger"}
          />
        </>
      }
    >
      <div id="hub-confirm-desc" className="px-1 text-center text-sm leading-relaxed text-[var(--muted)]">
        {message}
      </div>
    </HubToolDetailModal>
  );
}
