export type AppScreen = "library" | "system" | "users";

export function readAppScreen(): AppScreen {
  if (typeof window === "undefined") return "library";
  const p = new URLSearchParams(window.location.search);
  const screen = p.get("screen") ?? p.get("tab");
  if (screen === "system") return "system";
  if (screen === "users") return "users";
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
  if (screen === "users") {
    p.delete("stab");
    p.delete("table");
    p.delete("detail");
  }
  window.history.replaceState(null, "", `${window.location.pathname}?${p.toString()}`);
  window.dispatchEvent(new PopStateEvent("popstate"));
}
