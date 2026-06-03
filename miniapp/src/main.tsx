import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { bootstrapTelegramWebApp } from "./lib/telegramReady";
import { wakeApi } from "./lib/apiWarmup";
import "./i18n";
import "./styles/index.css";

bootstrapTelegramWebApp();
wakeApi();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
