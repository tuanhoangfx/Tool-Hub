import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { configureChartLegend, configureFilterIcons, configureHubChromePrefs } from "@tool-workspace/hub-ui";
import App from "./App";
import { hideBootLoader } from "./lib/hide-boot-loader";
import { resolveChartLegendIcon, resolveFilterAllIcon, resolveFilterOptionIcon } from "./lib/badge-registry";
import { initHubUserZoom } from "@tool-workspace/hub-ui";
import { readHubListPrefs } from "./lib/url-prefs";

initHubUserZoom();

configureHubChromePrefs(() => ({
  headerPin: readHubListPrefs().headerPin,
  searchPin: readHubListPrefs().searchPin,
}));

configureFilterIcons({
  resolveAll: resolveFilterAllIcon,
  resolveOption: (filterKey, value) =>
    resolveFilterOptionIcon(filterKey, { value, label: value }),
});

configureChartLegend(resolveChartLegendIcon);
import "./theme/hub-boot.css";
import "./theme/p0008-globals.css";
import "./theme/hub-auth.css";
import "./theme/hub-confirm.css";
import "./styles.css";

const rootEl = document.getElementById("root");
if (!rootEl) {
  throw new Error("#root not found");
}

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

requestAnimationFrame(() => {
  hideBootLoader();
});
