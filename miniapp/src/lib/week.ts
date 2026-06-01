/** ISO week key, e.g. 2026-W22 — aligned with server `getCurrentWeekKey`. */
export function getCurrentWeekKey(date = new Date()): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

export function parseIsoWeekNumber(weekKey: string): number {
  const match = weekKey.match(/^(\d{4})-W(\d{2})$/);
  return match ? parseInt(match[2], 10) : 1;
}

export function getWeekVariantIndex(weekKey: string, variantCount: number, phase = 0): number {
  if (variantCount <= 1) return 0;
  const weekNum = parseIsoWeekNumber(weekKey);
  return ((weekNum - 1 + phase) % variantCount + variantCount) % variantCount;
}

export type UtcWeekday = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

const UTC_WEEKDAY: UtcWeekday[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

export function getUtcWeekday(date = new Date()): UtcWeekday {
  return UTC_WEEKDAY[date.getUTCDay()];
}
