import { useTranslation } from "react-i18next";
import { useMe } from "../hooks/useMe";

export function SubscriptionTierBadge() {
  const { t } = useTranslation();
  const { me } = useMe();

  if (me.pro?.isPro) {
    return (
      <span className="sub-tier-badge sub-tier-badge--pro" title={t("pro.title")}>
        {t("pro.pill")}
      </span>
    );
  }

  if (me.access?.hasLiteCrew) {
    return (
      <span className="sub-tier-badge sub-tier-badge--lite" title={t("liteCrew.badge")}>
        {t("liteCrew.badge")}
      </span>
    );
  }

  return null;
}
