import type { AppScreen } from "./app-screen";

/** No-op: Users + System are eager-loaded with Hub (same bundle). Kept for API compatibility. */
export function prefetchAppScreen(_screen: AppScreen): void {
  /* eager */
}

export function prefetchAllAppScreens(): void {
  /* eager */
}
