import i18n, { ensureLocale } from "../i18n";
import { api } from "../api/client";
import { isRtlLocale, type AppLocale } from "./localeConfig";
import { setStoredLocale } from "./locale";

export async function setAppLocale(locale: AppLocale): Promise<void> {
  setStoredLocale(locale);
  await ensureLocale(locale);
  await i18n.changeLanguage(locale);
  document.documentElement.lang = locale;
  document.documentElement.dir = isRtlLocale(locale) ? "rtl" : "ltr";
  await api.setLocale(locale).catch(() => {
    /* offline / outside Telegram */
  });
}
