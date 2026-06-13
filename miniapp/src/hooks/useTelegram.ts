import { useEffect, useMemo } from "react";
import { applyTelegramTheme } from "../lib/telegramReady";

export function useTelegram() {
  const webApp = useMemo(() => window.Telegram?.WebApp, []);

  useEffect(() => {
    webApp?.ready();
    webApp?.expand();
    applyTelegramTheme(webApp);

    const onTheme = () => applyTelegramTheme(webApp);
    webApp?.onEvent?.("themeChanged", onTheme);
    return () => {
      webApp?.offEvent?.("themeChanged", onTheme);
    };
  }, [webApp]);

  const user = webApp?.initDataUnsafe?.user;

  return {
    webApp,
    user,
    initData: webApp?.initData ?? "",
    colorScheme: webApp?.colorScheme ?? "light",
  };
}
