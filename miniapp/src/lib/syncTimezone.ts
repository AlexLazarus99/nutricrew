import { api } from "../api/client";
import { detectTimezoneOffsetMinutes } from "./telegramShare";

const STORAGE_KEY = "nutricrew-tz-synced";

export function syncTimezoneOnce(): void {
  const offset = detectTimezoneOffsetMinutes();
  const stamp = `${offset}`;
  if (sessionStorage.getItem(STORAGE_KEY) === stamp) return;
  void api
    .setTimezone(offset)
    .then(() => sessionStorage.setItem(STORAGE_KEY, stamp))
    .catch(() => {
      /* non-blocking */
    });
}
