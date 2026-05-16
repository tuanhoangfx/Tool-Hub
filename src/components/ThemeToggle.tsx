import { MaterialIcon } from "./MaterialIcon";

type ThemeToggleProps = {
  isDark: boolean;
  onToggle: () => void;
};

export function ThemeToggle({ isDark, onToggle }: ThemeToggleProps) {
  return (
    <button className="theme-toggle" type="button" onClick={onToggle} aria-label={isDark ? "Light mode" : "Dark mode"} title={isDark ? "Light mode" : "Dark mode"}>
      <MaterialIcon name={isDark ? "light_mode" : "dark_mode"} size={22} />
    </button>
  );
}
