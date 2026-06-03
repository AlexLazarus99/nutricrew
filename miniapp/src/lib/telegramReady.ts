const INIT_DATA_WAIT_MS = 8000;

function hashFragment(): string {
  return window.location.hash.replace(/^#/, "");
}

/** Read initData from URL hash when SDK has not populated it yet (menu button launch). */
export function readInitDataFromHash(): string {
  const raw = hashFragment();
  if (!raw) return "";

  const params = new URLSearchParams(raw);
  const fromWrapper = params.get("tgWebAppData");
  if (fromWrapper) return fromWrapper;

  // Some Telegram clients pass signed fields directly in the fragment.
  if (params.has("auth_date") && params.has("hash")) {
    return raw;
  }

  return "";
}

function readInitDataFromSearch(): string {
  const params = new URLSearchParams(window.location.search);
  return params.get("tgWebAppData") ?? "";
}

/** Best available Telegram initData for API auth headers. */
export function getTelegramInitData(): string {
  const fromSdk = window.Telegram?.WebApp?.initData ?? "";
  if (fromSdk) return fromSdk;

  const fromHash = readInitDataFromHash();
  if (fromHash) return fromHash;

  return readInitDataFromSearch();
}

/** Short diagnostic string for auth errors (no secrets). */
export function getTelegramAuthDebug(): string {
  const platform = getTelegramPlatform();
  const hasSdk = Boolean(window.Telegram?.WebApp?.initData);
  const hasHash = Boolean(readInitDataFromHash());
  const hasSearch = Boolean(readInitDataFromSearch());
  return `tg:${platform} sdk:${hasSdk ? "yes" : "no"} hash:${hasHash ? "yes" : "no"} q:${hasSearch ? "yes" : "no"}`;
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

  const scheme = tg.colorScheme ?? "light";
  document.documentElement.dataset.colorScheme = scheme;
  document.documentElement.style.colorScheme = scheme;

  const params = tg.themeParams;
  if (params?.bg_color) {
    document.documentElement.style.setProperty("--tg-bg", params.bg_color);
  }
  if (params?.button_color) {
    document.documentElement.style.setProperty("--tg-button", params.button_color);
  }
}
