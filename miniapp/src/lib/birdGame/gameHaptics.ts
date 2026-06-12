import { isHapticsEnabled } from "../appPreferences";

export type HapticKind = "light" | "medium" | "heavy" | "success" | "warning";

export function gameHaptic(kind: HapticKind): void {
  if (!isHapticsEnabled()) return;
  const tg = window.Telegram?.WebApp as
    | { HapticFeedback?: { impactOccurred: (s: string) => void; notificationOccurred: (s: string) => void } }
    | undefined;
  const h = tg?.HapticFeedback;
  if (!h) return;

  try {
    if (kind === "success" || kind === "warning") {
      h.notificationOccurred(kind === "success" ? "success" : "warning");
      return;
    }
    const impact = kind === "heavy" ? "heavy" : kind === "medium" ? "medium" : "light";
    h.impactOccurred(impact);
  } catch {
    /* unsupported */
  }
}
