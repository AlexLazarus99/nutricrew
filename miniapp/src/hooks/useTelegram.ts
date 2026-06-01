import { useEffect, useMemo } from "react";

export function useTelegram() {
  const webApp = useMemo(() => window.Telegram?.WebApp, []);

  useEffect(() => {
    webApp?.ready();
    webApp?.expand();
  }, [webApp]);

  const user = webApp?.initDataUnsafe?.user;

  return {
    webApp,
    user,
    initData: webApp?.initData ?? "",
    colorScheme: webApp?.colorScheme ?? "light",
  };
}
