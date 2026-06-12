import { useTranslation } from "react-i18next";
import type { AppLocale } from "../lib/locale";
import i18n from "../i18n";
import { setAppLocale } from "../lib/setAppLocale";
import { SettingsSegment } from "./settings/SettingsSegment";

type Props = {
  compact?: boolean;
};

export function LanguageSwitcher({ compact = false }: Props) {
  const { t } = useTranslation();
  const current: AppLocale = i18n.language.startsWith("ru") ? "ru" : "en";

  function setLocale(locale: AppLocale) {
    void setAppLocale(locale);
  }

  if (compact) {
    return (
      <SettingsSegment
        value={current}
        ariaLabel={t("settings.language")}
        options={[
          { value: "en", label: "EN" },
          { value: "ru", label: "RU" },
        ]}
        onChange={setLocale}
      />
    );
  }

  return (
    <div className="lang-switcher">
      <span className="lang-label">{t("settings.language")}</span>
      <SettingsSegment
        value={current}
        ariaLabel={t("settings.language")}
        options={[
          { value: "en", label: "EN" },
          { value: "ru", label: "RU" },
        ]}
        onChange={setLocale}
      />
    </div>
  );
}
