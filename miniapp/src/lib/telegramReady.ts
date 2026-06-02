const INIT_DATA_WAIT_MS = 4000;

/** Wait until Telegram injects WebApp initData (avoids 401 on first paint). */
export function waitForTelegramInitData(): Promise<string> {
  const existing = window.Telegram?.WebApp?.initData ?? "";
  if (existing) {
    return Promise.resolve(existing);
  }

  if (!window.Telegram?.WebApp) {
    return Promise.resolve("");
  }

  window.Telegram.WebApp.ready();

  return new Promise((resolve) => {
    const started = Date.now();
    const tick = () => {
      const data = window.Telegram?.WebApp?.initData ?? "";
      if (data || Date.now() - started >= INIT_DATA_WAIT_MS) {
        resolve(data);
        return;
      }
      window.setTimeout(tick, 50);
    };
    tick();
  });
}
