import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "tool-hub-theme";
const LEGACY_VARIANT_KEY = "tool-hub-hub-variant";

/** light | dark = classic coral · hub = T1 Indigo Deep by default. */
export type Appearance = "light" | "dark" | "hub";

const CYCLE: Appearance[] = ["hub", "light", "dark"];

function readAppearance(): Appearance {
  if (typeof window === "undefined") return "hub";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark" || stored === "hub") return stored;
  return "hub";
}

export function applyAppearance(appearance: Appearance) {
  const root = document.documentElement;
  root.classList.remove("dark", "theme-hub", "hub-t1", "hub-t2", "hub-t3", "hub-t4", "hub-t5");
  if (appearance === "dark") root.classList.add("dark");
  if (appearance === "hub") root.classList.add("theme-hub");
}

export function useTheme() {
  const [appearance, setAppearanceState] = useState<Appearance>(() => readAppearance());

  useEffect(() => {
    applyAppearance(appearance);
    window.localStorage.setItem(STORAGE_KEY, appearance);
    window.localStorage.removeItem(LEGACY_VARIANT_KEY);
  }, [appearance]);

  const setAppearance = useCallback((next: Appearance) => setAppearanceState(next), []);

  const cycleAppearance = useCallback(() => {
    setAppearanceState((current) => {
      const i = CYCLE.indexOf(current);
      return CYCLE[(i + 1) % CYCLE.length];
    });
  }, []);

  return {
    appearance,
    isDark: appearance === "dark" || appearance === "hub",
    isHub: appearance === "hub",
    setAppearance,
    cycleAppearance,
    toggleTheme: cycleAppearance,
    theme: appearance === "dark" ? "dark" : appearance === "light" ? "light" : "dark",
  };
}
