import { type ReactNode } from "react";
import { Info } from "lucide-react";
import { HubToolDetailModal, HubToolDetailModalPrimaryAction } from "@tool-workspace/hub-ui";

type Props = {
  open: boolean;
  title: string;
  message: ReactNode;
  okLabel?: string;
  onClose: () => void;
};

/** Single-button in-app alert (replaces window.alert). */
export function HubAlertDialog({ open, title, message, okLabel = "OK", onClose }: Props) {
  return (
    <HubToolDetailModal
      open={open}
      onClose={onClose}
      title={title}
      titleId="hub-alert-title"
      headerIcon={Info}
      headerIconClassName="text-indigo-300"
      ariaLabelledBy="hub-alert-title"
      footer={<HubToolDetailModalPrimaryAction label={okLabel} onClick={onClose} />}
    >
      <div id="hub-alert-desc" className="px-1 text-center text-sm leading-relaxed text-[var(--muted)]">
        {message}
      </div>
    </HubToolDetailModal>
  );
}
