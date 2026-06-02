import { Pencil, Plus, Package, Trash2 } from "lucide-react";

type UserBulkActionBarProps = {
  hasSelection: boolean;
  selectedCount: number;
  loading: boolean;
  isAdmin: boolean;
  isManager: boolean;
  roleLoading: boolean;
  onAdd: () => void;
  onSyncTools: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

const btnBase =
  "inline-flex h-[var(--hub-control-h)] shrink-0 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40";

export function UserBulkActionBar({
  hasSelection,
  selectedCount,
  loading,
  isAdmin,
  isManager,
  roleLoading,
  onAdd,
  onSyncTools,
  onEdit,
  onDelete,
}: UserBulkActionBarProps) {
  const canEdit = isAdmin || isManager;
  const editEnabled = canEdit && hasSelection && !roleLoading;
  const deleteEnabled = isAdmin && hasSelection && !roleLoading;
  const addEnabled = isAdmin && !roleLoading;
  const syncEnabled = isAdmin && !loading && !roleLoading;

  return (
    <>
      <button
        type="button"
        disabled={!addEnabled}
        title={
          roleLoading
            ? "Loading your role…"
            : isAdmin
              ? "New users sign in via Supabase; sync workspace catalog"
              : "Admin only"
        }
        onClick={onAdd}
        className={`${btnBase} border border-emerald-500/35 bg-emerald-500/15 text-emerald-100 hover:bg-emerald-500/25`}
      >
        <Plus size={14} aria-hidden />
        Add
      </button>
      <button
        type="button"
        disabled={!editEnabled}
        onClick={onEdit}
        title={
          roleLoading
            ? "Loading your role…"
            : !canEdit
              ? "Admin or manager only"
              : hasSelection
                ? "Edit name, email, role, tools"
                : "Select one or more users"
        }
        className={`${btnBase} border border-indigo-400/35 bg-indigo-500/15 text-indigo-100 hover:bg-indigo-500/25`}
      >
        <Pencil size={14} aria-hidden />
        Edit
        {hasSelection ? (
          <span className="grid h-4 min-w-[var(--hub-count-badge-min-w)] place-items-center rounded-full bg-indigo-400 px-1 text-[9px] font-bold text-[#0f1220]">
            {selectedCount}
          </span>
        ) : null}
      </button>
      <button
        type="button"
        disabled={!deleteEnabled}
        onClick={onDelete}
        title={
          roleLoading
            ? "Loading your role…"
            : isAdmin
              ? "Clear tool access for selected users"
              : "Admin only"
        }
        className={`${btnBase} border border-rose-500/35 bg-rose-500/15 text-rose-100 hover:bg-rose-500/25`}
      >
        <Trash2 size={14} aria-hidden />
        Delete
      </button>
      <button
        type="button"
        disabled={!syncEnabled}
        onClick={onSyncTools}
        title={roleLoading ? "Loading your role…" : isAdmin ? "Sync P00xx tools and E00xx extensions" : "Admin only"}
        className={`${btnBase} border border-sky-500/30 bg-sky-500/12 text-sky-100 hover:bg-sky-500/20`}
      >
        <Package size={14} aria-hidden />
        Sync tools
      </button>
    </>
  );
}
