import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { hideBootLoader } from "./lib/hide-boot-loader";
import "./theme/hub-boot.css";
import "./theme/p0008-globals.css";
import "./theme/hub-auth.css";
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
