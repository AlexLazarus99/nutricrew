/** Telegram Mini App share + invite deep links. */

type TgWebApp = {
  shareToStory?: (opts: { text: string; widget_link?: { url: string; name: string } }) => void;
  openTelegramLink?: (url: string) => void;
};

export function getTelegramWebApp(): TgWebApp | undefined {
  return window.Telegram?.WebApp as TgWebApp | undefined;
}

export function buildInviteStartParam(inviteCode: string, referrerTelegramId?: number): string {
  const code = inviteCode.trim().toUpperCase();
  if (referrerTelegramId != null && Number.isFinite(referrerTelegramId)) {
    return `join_${code}_ref_${referrerTelegramId}`;
  }
  return `join_${code}`;
}

export function buildInviteUrl(
  inviteCode: string,
  botUsername: string | null | undefined,
  referrerTelegramId?: number,
  fallbackUrl?: string | null,
): string | null {
  if (fallbackUrl) return fallbackUrl;
  const user = botUsername?.replace(/^@/, "");
  if (!user) return null;
  const startParam = buildInviteStartParam(inviteCode, referrerTelegramId);
  return `https://t.me/${user}?startapp=${encodeURIComponent(startParam)}`;
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function shareInviteLink(opts: {
  inviteCode: string;
  botUsername?: string | null;
  inviteUrl?: string | null;
  referrerTelegramId?: number;
  title: string;
  text: string;
}): "shared" | "copied" | "failed" {
  const url = buildInviteUrl(
    opts.inviteCode,
    opts.botUsername,
    opts.referrerTelegramId,
    opts.inviteUrl,
  );
  if (!url) return "failed";

  const tg = getTelegramWebApp();
  const shareText = `${opts.text}\n\n${url}`;

  if (tg?.shareToStory) {
    try {
      tg.shareToStory({ text: shareText, widget_link: { url, name: opts.title } });
      return "shared";
    } catch {
      /* fall through */
    }
  }

  if (tg?.openTelegramLink) {
    try {
      const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(opts.text)}`;
      tg.openTelegramLink(shareUrl);
      return "shared";
    } catch {
      /* fall through */
    }
  }

  void copyToClipboard(shareText);
  return "copied";
}

export function shareMealResult(opts: {
  text: string;
  inviteUrl?: string | null;
}): "shared" | "copied" | "failed" {
  const tg = getTelegramWebApp();
  const body = opts.inviteUrl ? `${opts.text}\n\n${opts.inviteUrl}` : opts.text;

  if (tg?.openTelegramLink) {
    try {
      const shareUrl = `https://t.me/share/url?text=${encodeURIComponent(body)}`;
      tg.openTelegramLink(shareUrl);
      return "shared";
    } catch {
      /* fall through */
    }
  }

  void copyToClipboard(body);
  return "copied";
}

/** JS getTimezoneOffset is minutes behind UTC; we store minutes ahead of UTC. */
export function detectTimezoneOffsetMinutes(): number {
  return -new Date().getTimezoneOffset();
}
