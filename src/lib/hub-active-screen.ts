import { readSystemTab } from "../features/system-hub/components/SystemTabs";
import { readAppScreen, type AppScreen } from "./app-screen";

/** Read current shortcut scope from URL (for tests / debug). */
export function readHubKeyboardScope(): string {
  const screen = readAppScreen();
  if (screen === "system") {
    return `system-${readSystemTab()}`;
  }
  return screen;
}

export type { AppScreen };
