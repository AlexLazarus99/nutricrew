import { config } from "../config.js";

export function normalizeTelegramUsername(
  username: string | null | undefined,
): string | null {
  if (!username) return null;
  const normalized = username.trim().replace(/^@/, "").toLowerCase();
  return normalized || null;
}

export function isAdminTelegramUsername(
  username: string | null | undefined,
): boolean {
  const normalized = normalizeTelegramUsername(username);
  if (!normalized) return false;
  return config.admin.telegramUsernames.includes(normalized);
}

export function isAdminTelegramId(telegramId: number | null | undefined): boolean {
  if (telegramId == null) return false;
  return config.admin.telegramIds.includes(telegramId);
}

export function isAdminUser(
  user: { username?: string | null; telegram_id?: number | null },
): boolean {
  return (
    isAdminTelegramUsername(user.username) ||
    isAdminTelegramId(user.telegram_id ?? null)
  );
}
