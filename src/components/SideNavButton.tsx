import { MaterialIcon } from "./MaterialIcon";

type SideNavButtonProps = {
  active: boolean;
  icon: string;
  label: string;
  onClick: () => void;
};

export function SideNavButton({ active, icon, label, onClick }: SideNavButtonProps) {
  return (
    <button className={active ? "active" : ""} type="button" onClick={onClick}>
      <MaterialIcon name={icon} size={18} filled={active} />
      <span>{label}</span>
    </button>
  );
}
