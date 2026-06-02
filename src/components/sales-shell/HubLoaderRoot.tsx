/** Single portal mount — all tab loaders render here for one fixed viewport center. */
export const HUB_TAB_LOADER_ROOT_ID = "hub-tab-loader-root";

export function HubLoaderRoot() {
  return <div id={HUB_TAB_LOADER_ROOT_ID} className="pointer-events-none" aria-hidden />;
}
