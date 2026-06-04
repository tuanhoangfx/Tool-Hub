import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, X, type LucideIcon } from "lucide-react";
import "../theme/hub-confirm.css";

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
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !confirmBusy) onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.classList.add("hub-modal-open");
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.classList.remove("hub-modal-open");
    };
  }, [open, onClose, confirmBusy]);

  if (!open) return null;

  return createPortal(
    <div className="auth-gate-root hub-confirm-root" role="presentation">
      <div className="auth-gate-backdrop" aria-hidden onClick={confirmBusy ? undefined : onClose} />
      <div
        className="auth-gate-modal hub-confirm-modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="hub-confirm-title"
        aria-describedby="hub-confirm-desc"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="auth-gate-close"
          onClick={onClose}
          disabled={confirmBusy}
          aria-label="Close"
        >
          <X size={16} />
        </button>

        <div className={`hub-confirm-icon hub-confirm-icon--${tone}`} aria-hidden>
          <Icon size={22} />
        </div>

        <h2 id="hub-confirm-title" className="auth-gate-title !text-left">
          {title}
        </h2>
        <div id="hub-confirm-desc" className="hub-confirm-message">
          {message}
        </div>

        <div className="auth-gate-actions">
          <button type="button" className="auth-gate-secondary" onClick={onClose} disabled={confirmBusy}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`hub-confirm-primary hub-confirm-primary--${tone}`}
            onClick={onConfirm}
            disabled={confirmBusy}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
