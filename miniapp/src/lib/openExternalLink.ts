export function openExternalLink(url: string): void {
  const tg = window.Telegram?.WebApp as { openLink?: (u: string) => void } | undefined;
  if (tg?.openLink) {
    tg.openLink(url);
    return;
  }
  window.open(url, "_blank", "noopener,noreferrer");
}
