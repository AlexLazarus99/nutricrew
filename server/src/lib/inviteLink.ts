import { config } from "../config.js";

export function buildTeamInviteStartParam(inviteCode: string, referrerTelegramId?: number): string {
  const code = inviteCode.trim().toUpperCase();
  if (referrerTelegramId && Number.isFinite(referrerTelegramId)) {
    return `join_${code}_ref_${referrerTelegramId}`;
  }
  return `join_${code}`;
}

export function buildTeamInviteUrl(inviteCode: string, referrerTelegramId?: number): string | null {
  const username = config.botUsername;
  if (!username) return null;
  const startParam = buildTeamInviteStartParam(inviteCode, referrerTelegramId);
  return `https://t.me/${username}?startapp=${encodeURIComponent(startParam)}`;
}
