import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { initI18n } from "./i18n";
import { bootstrapTelegramWebApp } from "./lib/telegramReady";
import { installDevHealthBridge } from "./lib/health/devHealthBridge";
import { wakeApi } from "./lib/apiWarmup";
import "./styles/design-tokens.css";
import "./styles/index.css";
import "./styles/wellness-theme.css";
import "./styles/design-patterns.css";
import "./styles/animations.css";
import "./styles/splash.css";
import "./styles/nutribird-mark.css";
import "./styles/quest-icons.css";
import "./styles/level-badges.css";
import "./styles/achievement-badges.css";
import "./styles/valuation.css";
import "./styles/nav-badges.css";
import "./styles/motion-badges.css";

bootstrapTelegramWebApp();
if (import.meta.env.VITE_MOCK_HEALTH_BRIDGE === "1") {
  installDevHealthBridge();
}
wakeApi();

void initI18n().then(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </StrictMode>,
  );
});
