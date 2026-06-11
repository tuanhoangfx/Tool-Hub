import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { configureChartLegend, configureFilterIcons, configureHubChromePrefs, initHubUserZoom, mountHubApp } from "@tool-workspace/hub-ui";
import App from "./App";
import { resolveP0004ChartLegendIcon } from "./lib/badge-registry-chart";
import { resolveFilterAllIcon, resolveFilterOptionIcon } from "./lib/badge-registry";
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

configureChartLegend(resolveP0004ChartLegendIcon);
import "./theme/hub-boot.css";
import "./theme/p0008-globals.css";
import "./theme/hub-confirm.css";
import "./styles.css";

const rootEl = document.getElementById("root");
if (!rootEl) {
  throw new Error("#root not found");
}

mountHubApp(rootEl, () => {
  createRoot(rootEl).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
