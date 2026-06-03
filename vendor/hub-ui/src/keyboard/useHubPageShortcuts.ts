import { useEffect } from "react";
import { registerHubPageShortcuts, type HubPageShortcutHandlers } from "./hub-keyboard-shortcuts";

/**
 * Register N/E handlers for a sidebar tab (library | users | system).
 * Safe with keep-mounted tabs — only `setHubActiveScreen` picks which scope runs.
 */
export function useHubPageShortcuts(screenId: string, handlers: HubPageShortcutHandlers) {
  useEffect(() => {
    return registerHubPageShortcuts(screenId, handlers);
  }, [
    screenId,
    handlers.onNew,
    handlers.onEdit,
    handlers.canNew,
    handlers.canEdit,
  ]);
}
