import { useTranslation } from "react-i18next";
import { useMe } from "../../hooks/useMe";
import { isInTrial } from "../../lib/userAccess";

export function TrialBanner() {
  const { t } = useTranslation();
  const { me } = useMe();

  if (!isInTrial(me) || !me.access) return null;

  return (
    <div className="trial-banner" role="status">
      <span className="trial-banner__icon" aria-hidden>
        ⏳
      </span>
      <span>{t("liteCrew.trialBadge", { hours: me.access.trialHoursLeft })}</span>
    </div>
  );
}
