import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Info, X } from "lucide-react";
import "../theme/hub-confirm.css";

type Props = {
  open: boolean;
  title: string;
  message: ReactNode;
  okLabel?: string;
  onClose: () => void;
};

/** Single-button in-app alert (replaces window.alert). */
export function HubAlertDialog({ open, title, message, okLabel = "OK", onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.classList.add("hub-modal-open");
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.classList.remove("hub-modal-open");
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="auth-gate-root hub-confirm-root" role="presentation">
      <div className="auth-gate-backdrop" aria-hidden onClick={onClose} />
      <div
        className="auth-gate-modal hub-confirm-modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="hub-alert-title"
        aria-describedby="hub-alert-desc"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="auth-gate-close" onClick={onClose} aria-label="Close">
          <X size={16} />
        </button>

        <div className="hub-confirm-icon hub-confirm-icon--info" aria-hidden>
          <Info size={22} />
        </div>

        <h2 id="hub-alert-title" className="auth-gate-title !text-left">
          {title}
        </h2>
        <div id="hub-alert-desc" className="hub-confirm-message">
          {message}
        </div>

        <div className="auth-gate-actions">
          <button type="button" className="auth-gate-submit" onClick={onClose}>
            {okLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
