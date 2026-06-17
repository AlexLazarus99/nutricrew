import { useTranslation } from "react-i18next";
import i18n from "../i18n";
import { APP_LOCALE_OPTIONS, isAppLocale, type AppLocale } from "../lib/localeConfig";
import { setAppLocale } from "../lib/setAppLocale";
import { resolveAppLocale } from "../lib/formatLocale";

type Props = {
  compact?: boolean;
};

export function LanguageSwitcher({ compact = false }: Props) {
  const { t } = useTranslation();
  const current = resolveAppLocale(i18n.language);

  function pick(locale: AppLocale) {
    if (locale === current) return;
    void setAppLocale(locale);
  }

  return (
    <div className={`lang-picker${compact ? " lang-picker--compact" : ""}`}>
      {!compact ? <span className="lang-label">{t("settings.language")}</span> : null}
      <p className="lang-picker__hint muted small">{t("settings.languageHint")}</p>
      <ul className="lang-picker__list" role="listbox" aria-label={t("settings.language")}>
        {APP_LOCALE_OPTIONS.map((opt) => (
          <li key={opt.code}>
            <button
              type="button"
              role="option"
              aria-selected={current === opt.code}
              className={`lang-picker__item${current === opt.code ? " active" : ""}`}
              onClick={() => {
                if (isAppLocale(opt.code)) pick(opt.code);
              }}
            >
              <span className="lang-picker__flag" aria-hidden>
                {opt.flag}
              </span>
              <span className="lang-picker__name">{opt.nativeLabel}</span>
              {current === opt.code ? (
                <span className="lang-picker__check" aria-hidden>
                  ✓
                </span>
              ) : null}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
