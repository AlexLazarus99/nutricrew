import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { bootstrapTelegramWebApp } from "./lib/telegramReady";
import { wakeApi } from "./lib/apiWarmup";
import "./i18n";
import "./styles/index.css";
import "./styles/wellness-theme.css";
import "./styles/splash.css";
import "./styles/features.css";

bootstrapTelegramWebApp();
wakeApi();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
