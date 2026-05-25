import type { Appearance } from "../hooks/useTheme";
import { MaterialIcon } from "./MaterialIcon";

type ThemeToggleProps = {
  appearance: Appearance;
  onCycle: () => void;
};

const LABELS: Record<Appearance, { icon: string; label: string }> = {
  hub: { icon: "hub", label: "Hub theme (V1)" },
  light: { icon: "light_mode", label: "Light theme" },
  dark: { icon: "dark_mode", label: "Dark theme" },
};

export function ThemeToggle({ appearance, onCycle }: ThemeToggleProps) {
  const { icon, label } = LABELS[appearance];
  return (
    <button className="theme-toggle" type="button" onClick={onCycle} aria-label={label} title={label}>
      <MaterialIcon name={icon} size={22} />
    </button>
  );
}
