/** Resolved Users tab id — matches `resolveHubActiveScreenId("users")`. */
export const USERS_LOG_SCREEN = "users";

export function pushUsersLog(scope: string, message: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("hub-app-log", {
      detail: { scope, message, screen: USERS_LOG_SCREEN },
    }),
  );
}
