import { useTranslation } from "react-i18next";
import { useMe } from "../../hooks/useMe";
import { ProTributeCheckout } from "../pro/ProTributeCheckout";

export function AccessPaywall() {
  const { t } = useTranslation();
  const { me, refresh } = useMe();

  return (
    <section className="stack access-paywall-page">
      <div className="card access-paywall">
        <p className="access-paywall__badge">{t("liteCrew.badge")}</p>
        <h2>{t("liteCrew.paywallTitle")}</h2>
        <p className="access-paywall__lead">{t("liteCrew.paywallLead")}</p>

        <div className="access-tutorial card">
          <h3 className="access-tutorial__title">{t("liteCrew.tutorialTitle")}</h3>
          <ol className="access-tutorial__steps">
            <li className="access-tutorial__step access-tutorial__step--lite">
              <span className="access-tutorial__icon" aria-hidden>
                ✨
              </span>
              <div>
                <strong>{t("liteCrew.buyBtn")}</strong>
                <p className="muted small">{t("liteCrew.tutorialLite")}</p>
              </div>
            </li>
            <li className="access-tutorial__step access-tutorial__step--pro">
              <span className="access-tutorial__icon" aria-hidden>
                ⭐
              </span>
              <div>
                <strong>{t("pro.buyTribute")}</strong>
                <p className="muted small">{t("liteCrew.tutorialPro")}</p>
              </div>
            </li>
          </ol>
          <p className="access-tutorial__arrow muted small">{t("liteCrew.tutorialHint")}</p>
        </div>

        <ul className="access-paywall__features">
          <li>{t("liteCrew.featureDiary")}</li>
          <li>{t("liteCrew.featureTeams")}</li>
          <li>{t("liteCrew.featureGames")}</li>
        </ul>

        <p className="access-paywall__price">{t("liteCrew.priceLine")}</p>

        <ProTributeCheckout source="access-paywall" />

        <p className="muted small">{t("liteCrew.tributeHint")}</p>

        <button type="button" className="btn btn-secondary btn-block" onClick={() => void refresh()}>
          {t("liteCrew.refreshAccess")}
        </button>
      </div>

      {me.access?.hasLiteCrew && me.access.liteCrewUntil ? (
        <p className="muted small success">{t("liteCrew.activeUntil", { date: new Date(me.access.liteCrewUntil).toLocaleDateString() })}</p>
      ) : null}
    </section>
  );
}
