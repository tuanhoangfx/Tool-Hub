import { useEffect } from "react";
import { createPortal } from "react-dom";
import { UserAddForm, type UserAddFormProps } from "./UserAddForm";

type Props = Pick<
  UserAddFormProps,
  "onClose" | "onCreateSingle" | "onCreateMany"
>;

export function UserAddModal({ open, onClose, onCreateSingle, onCreateMany }: Props & { open: boolean }) {
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
    <div className="auth-gate-root" role="presentation">
      <div className="auth-gate-backdrop" aria-hidden onClick={onClose} />
      <UserAddForm
        active
        variant="modal"
        onClose={onClose}
        onCreateSingle={onCreateSingle}
        onCreateMany={onCreateMany}
      />
    </div>,
    document.body,
  );
}
