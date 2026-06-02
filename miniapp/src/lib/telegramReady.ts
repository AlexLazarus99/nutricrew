const INIT_DATA_WAIT_MS = 8000;

/** Read initData from URL hash when SDK has not populated it yet (menu button launch). */
export function readInitDataFromHash(): string {
  const raw = window.location.hash.replace(/^#/, "");
  if (!raw) return "";

  for (const part of raw.split("&")) {
    if (part.startsWith("tgWebAppData=")) {
      return decodeURIComponent(part.slice("tgWebAppData=".length));
    }
  }
  return "";
}

/** Best available Telegram initData for API auth headers. */
export function getTelegramInitData(): string {
  const fromSdk = window.Telegram?.WebApp?.initData ?? "";
  if (fromSdk) return fromSdk;
  return readInitDataFromHash();
}

export function getTelegramPlatform(): string {
  return (window.Telegram?.WebApp as { platform?: string } | undefined)?.platform ?? "unknown";
}

/** True when running inside Telegram client (not external browser). */
export function isTelegramClient(): boolean {
  if (!window.Telegram?.WebApp) return false;
  const platform = getTelegramPlatform();
  return platform !== "unknown" && platform !== "";
}

/** Wait until Telegram injects WebApp initData. */
export function waitForTelegramInitData(): Promise<string> {
  const immediate = getTelegramInitData();
  if (immediate) return Promise.resolve(immediate);

  if (!window.Telegram?.WebApp) {
    return Promise.resolve("");
  }

  window.Telegram.WebApp.ready();

  return new Promise((resolve) => {
    const started = Date.now();
    const tick = () => {
      const data = getTelegramInitData();
      if (data || Date.now() - started >= INIT_DATA_WAIT_MS) {
        resolve(data);
        return;
      }
      window.setTimeout(tick, 50);
    };
    tick();
  });
}

export function bootstrapTelegramWebApp(): void {
  const tg = window.Telegram?.WebApp;
  if (!tg) return;
  tg.ready();
  tg.expand();
}
