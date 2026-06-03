export type HubShortcutId = "search" | "new" | "edit" | "dismiss";

export const HUB_SHORTCUT_LEGEND: { id: HubShortcutId; keys: string; label: string }[] = [
  { id: "search", keys: "F", label: "Search" },
  { id: "new", keys: "N", label: "Add / create" },
  { id: "edit", keys: "E", label: "Edit selection" },
  { id: "dismiss", keys: "Esc", label: "Close modal" },
];

export type HubPageShortcutHandlers = {
  onNew?: () => void;
  onEdit?: () => void;
  canNew?: () => boolean;
  canEdit?: () => boolean;
};

let activeScreenId = "default";
const searchFocusByScreen = new Map<string, () => void>();
const handlersByScreen = new Map<string, HubPageShortcutHandlers>();
let listenerAttached = false;

/** Call from app shell when sidebar tab changes (library | users | system). */
export function setHubActiveScreen(screenId: string) {
  activeScreenId = screenId || "default";
}

export function getHubActiveScreen(): string {
  return activeScreenId;
}

export function isHubTypingTarget(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;
  const el = target;
  if (el.isContentEditable) return true;
  const tag = el.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  return Boolean(el.closest("[contenteditable='true']"));
}

export function registerHubSearchFocus(screenId: string, fn: () => void): () => void {
  searchFocusByScreen.set(screenId, fn);
  ensureHubKeyboardListener();
  return () => {
    searchFocusByScreen.delete(screenId);
  };
}

export function registerHubPageShortcuts(screenId: string, handlers: HubPageShortcutHandlers): () => void {
  handlersByScreen.set(screenId, handlers);
  ensureHubKeyboardListener();
  return () => {
    handlersByScreen.delete(screenId);
  };
}

/** @deprecated Use registerHubPageShortcuts(screenId, handlers) */
export function configureHubPageShortcuts(handlers: HubPageShortcutHandlers): void {
  registerHubPageShortcuts(activeScreenId, handlers);
}

function hasModifier(e: KeyboardEvent): boolean {
  return e.ctrlKey || e.metaKey || e.altKey;
}

function activeHandlers(): HubPageShortcutHandlers {
  return handlersByScreen.get(activeScreenId) ?? {};
}

function onGlobalKeyDown(e: KeyboardEvent) {
  if (e.key === "Escape") return;

  const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  const handlers = activeHandlers();

  if (key === "f" && !hasModifier(e)) {
    if (isHubTypingTarget(e.target)) return;
    const focus = searchFocusByScreen.get(activeScreenId);
    if (focus) {
      e.preventDefault();
      focus();
    }
    return;
  }

  if (isHubTypingTarget(e.target)) return;

  if (key === "n" && !hasModifier(e)) {
    if (handlers.onNew && (handlers.canNew?.() ?? true)) {
      e.preventDefault();
      handlers.onNew();
    }
    return;
  }

  if (key === "e" && !hasModifier(e)) {
    if (handlers.onEdit && (handlers.canEdit?.() ?? true)) {
      e.preventDefault();
      handlers.onEdit();
    }
  }
}

function ensureHubKeyboardListener() {
  if (listenerAttached || typeof window === "undefined") return;
  listenerAttached = true;
  window.addEventListener("keydown", onGlobalKeyDown, true);
}
