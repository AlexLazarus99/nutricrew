/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GOOGLE_FIT_CLIENT_ID?: string;
  readonly VITE_MOCK_HEALTH_BRIDGE?: string;
  readonly VITE_MOCK_HEALTH_STEPS?: string;
  readonly VITE_MOCK_HEALTH_SOURCE?: "apple_health" | "health_connect";
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface TelegramWebApp {
  initData: string;
  initDataUnsafe: {
    user?: {
      id: number;
      first_name: string;
      last_name?: string;
      username?: string;
      language_code?: string;
      photo_url?: string;
    };
    start_param?: string;
  };
  ready: () => void;
  expand: () => void;
  close: () => void;
  MainButton: {
    text: string;
    show: () => void;
    hide: () => void;
    onClick: (cb: () => void) => void;
    offClick: (cb: () => void) => void;
    showProgress: (leaveActive?: boolean) => void;
    hideProgress: () => void;
  };
  themeParams: Record<string, string | undefined>;
  colorScheme: "light" | "dark";
  platform?: string;
  version?: string;
  onEvent?: (event: string, handler: () => void) => void;
  offEvent?: (event: string, handler: () => void) => void;
}

interface Window {
  Telegram?: { WebApp: TelegramWebApp };
}
