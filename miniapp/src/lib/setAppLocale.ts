import i18n, { ensureLocale } from "../i18n";
import { api } from "../api/client";
import { setStoredLocale, type AppLocale } from "./locale";

export async function setAppLocale(locale: AppLocale): Promise<void> {
  setStoredLocale(locale);
  await ensureLocale(locale);
  await i18n.changeLanguage(locale);
  await api.setLocale(locale).catch(() => {
    /* offline / outside Telegram */
  });
}
