import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { mealsUntilProfileRequired } from "../../lib/guestSession";

type Props = {
  hasTeam: boolean;
};

export function GuestModeBanner({ hasTeam }: Props) {
  const { t } = useTranslation();
  const left = mealsUntilProfileRequired();

  return (
    <div className="card guest-mode-banner">
      <p className="guest-mode-banner__title">{t("guest.modeTitle")}</p>
      <p className="muted small">{t("guest.modeHint", { left })}</p>
      {!hasTeam && (
        <p className="guest-mode-banner__team muted small">{t("guest.teamBoostHint")}</p>
      )}
      <Link to="/" className="btn btn-secondary btn-sm">
        {t("guest.joinTeamCta")}
      </Link>
    </div>
  );
}
