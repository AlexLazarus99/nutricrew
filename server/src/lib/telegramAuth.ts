import crypto from "node:crypto";

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
}

export interface ParsedInitData {
  user: TelegramUser;
  authDate: number;
  queryId?: string;
  startParam?: string;
}

export function validateInitData(initData: string, botToken: string): boolean {
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) return false;

  params.delete("hash");
  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  const secretKey = crypto
    .createHmac("sha256", "WebAppData")
    .update(botToken)
    .digest();

  const calculatedHash = crypto
    .createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  return calculatedHash === hash;
}

export function parseInitData(initData: string): ParsedInitData | null {
  const params = new URLSearchParams(initData);
  const userRaw = params.get("user");
  const authDateRaw = params.get("auth_date");

  if (!userRaw || !authDateRaw) return null;

  try {
    const user = JSON.parse(userRaw) as TelegramUser;
    const authDate = Number(authDateRaw);
    if (!Number.isFinite(authDate)) return null;

    return {
      user,
      authDate,
      queryId: params.get("query_id") ?? undefined,
      startParam: params.get("start_param") ?? undefined,
    };
  } catch {
    return null;
  }
}

/** Reject init data older than 24 hours (Telegram recommendation). */
export function isInitDataFresh(authDate: number, maxAgeSec = 86_400): boolean {
  const now = Math.floor(Date.now() / 1000);
  return now - authDate <= maxAgeSec;
}
