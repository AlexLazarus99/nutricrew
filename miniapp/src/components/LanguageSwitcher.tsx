import { useTranslation } from "react-i18next";
import { setStoredLocale, type AppLocale } from "../lib/locale";
import i18n from "../i18n";
import { api } from "../api/client";

export function LanguageSwitcher() {
  const { t } = useTranslation();
  const current = i18n.language.startsWith("ru") ? "ru" : "en";

  function setLocale(locale: AppLocale) {
    setStoredLocale(locale);
    void i18n.changeLanguage(locale);
    void api.setLocale(locale).catch(() => {
      /* offline / outside Telegram */
    });
  }

  return (
    <div className="lang-switcher">
      <span className="lang-label">{t("settings.language")}</span>
      <div className="lang-buttons">
        <button
          type="button"
          className={current === "en" ? "active" : ""}
          onClick={() => setLocale("en")}
        >
          EN
        </button>
        <button
          type="button"
          className={current === "ru" ? "active" : ""}
          onClick={() => setLocale("ru")}
        >
          RU
        </button>
      </div>
    </div>
  );
}
