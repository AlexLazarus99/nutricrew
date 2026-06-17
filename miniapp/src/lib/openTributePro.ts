import { trackEvent } from "./analytics";

const FALLBACK_TRIBUTE = "https://t.me/tribute";

type TgWebApp = {
  openTelegramLink?: (url: string) => void;
  openLink?: (url: string) => void;
};

export function openTributePro(url: string | null | undefined, source?: string): void {
  trackEvent("pro_tribute_click", { source: source ?? "unknown" });
  const target = url?.trim() || FALLBACK_TRIBUTE;
  const tg = window.Telegram?.WebApp as TgWebApp | undefined;

  if (tg?.openTelegramLink && /t\.me\//i.test(target)) {
    tg.openTelegramLink(target);
    return;
  }
  if (tg?.openLink) {
    tg.openLink(target);
    return;
  }
  window.open(target, "_blank", "noopener,noreferrer");
}
