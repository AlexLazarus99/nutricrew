import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { SupportBadgeIcon } from "../support/SupportBadgeIcon";

export function SettingsSupportLink() {
  const { t } = useTranslation();

  return (
    <Link to="/support" className="settings-support-link">
      <span className="settings-support-link__aurora" aria-hidden />
      <span className="settings-support-link__shimmer" aria-hidden />
      <span className="settings-support-link__body">
        <SupportBadgeIcon size={52} />
        <span className="settings-support-link__copy">
          <strong>{t("support.settingsTitle")}</strong>
          <span className="muted small">{t("support.settingsHint")}</span>
        </span>
        <span className="settings-support-link__chevron" aria-hidden>
          →
        </span>
      </span>
    </Link>
  );
}
