import { UserPlus } from "lucide-react";
import { HubToolDetailModal } from "@tool-workspace/hub-ui";
import { UserAddForm, type UserAddFormProps } from "./UserAddForm";

type Props = Pick<UserAddFormProps, "onClose" | "onCreateSingle" | "onCreateMany"> & { open: boolean };

export function UserAddModal({ open, onClose, onCreateSingle, onCreateMany }: Props) {
  return (
    <HubToolDetailModal
      open={open}
      onClose={onClose}
      title="Add users"
      titleId="user-add-modal-title"
      headerIcon={UserPlus}
      headerIconClassName="text-emerald-300"
      ariaLabelledBy="user-add-modal-title"
    >
      <UserAddForm
        active={open}
        variant="embedded"
        onClose={onClose}
        onCreateSingle={onCreateSingle}
        onCreateMany={onCreateMany}
      />
    </HubToolDetailModal>
  );
}
