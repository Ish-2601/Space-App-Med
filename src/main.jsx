import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./styles.css";
import "./console.css";
import "./clean.css";
import "./health-screens.css";
import "./home-upgrades.css";
import "./body-upgrades.css";
import "./specialty-tools.css";
import "./clinical-tools.css";
import "./emergency-tools.css";
import "./ar-crew-tools.css";
import "./catalog.css";
import "./mission-utility.css";
import "./mission-ui.css";
import "./final-theme.css";
import { applyDisplay } from "./display.js";

applyDisplay();

createRoot(document.getElementById("root")).render(<App />);

// Offline support in the built app (not during development, to avoid stale caches)
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () =>
    navigator.serviceWorker.register("./sw.js").catch(() => {}),
  );
}
