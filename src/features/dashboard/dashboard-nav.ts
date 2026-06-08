import { setAppScreen } from "../../lib/app-screen";
import { setSystemTab } from "../system-hub/components/SystemTabs";
import type { DashboardTabEntry } from "./dashboard-tab-registry";

/** Open a dashboard registry entry in the matching P0004 tab route. */
export function navigateToDashboardTab(entry: DashboardTabEntry) {
  if (entry.screen === "dashboard") {
    setAppScreen("dashboard");
    return;
  }
  if (entry.systemTab) {
    setAppScreen("system");
    setSystemTab(entry.systemTab);
    return;
  }
  setAppScreen(entry.screen);
}
