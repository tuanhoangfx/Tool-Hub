export type AppScreen = "library" | "system";

export function readAppScreen(): AppScreen {
  if (typeof window === "undefined") return "library";
  const p = new URLSearchParams(window.location.search);
  const screen = p.get("screen") ?? p.get("tab");
  if (screen === "system") return "system";
  return "library";
}

export function setAppScreen(screen: AppScreen) {
  const p = new URLSearchParams(window.location.search);
  p.set("screen", screen);
  if (screen === "system" && !p.get("stab")) {
    p.set("stab", "overview");
  }
  if (screen === "library") {
    p.delete("stab");
    p.delete("table");
    p.delete("detail");
  }
  window.history.replaceState(null, "", `${window.location.pathname}?${p.toString()}`);
  window.dispatchEvent(new PopStateEvent("popstate"));
}
