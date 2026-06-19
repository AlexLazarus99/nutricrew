import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { openExternalLink } from "../lib/openExternalLink";

const CONTACT_EMAIL = "hello@nutricrew.app";
const CAL_URL = "https://cal.com/nutricrew";
const BOT_URL = "https://t.me/nutricrew_bot";

export function B2BLandingPage() {
  const { t } = useTranslation();

  const features = ["teams", "analytics", "engagement", "privacy"] as const;

  return (
    <section className="stack b2b-page">
      <div className="card b2b-hero pro-animate-in">
        <p className="b2b-hero__eyebrow">{t("b2b.eyebrow")}</p>
        <h1 className="b2b-hero__title">{t("b2b.title")}</h1>
        <p className="b2b-hero__lead">{t("b2b.lead")}</p>
        <div className="b2b-hero__cta">
          <button type="button" className="btn btn-primary" onClick={() => openExternalLink(CAL_URL)}>
            {t("b2b.ctaDemo")}
          </button>
          <a className="btn btn-secondary" href={`mailto:${CONTACT_EMAIL}`}>
            {t("b2b.ctaEmail")}
          </a>
        </div>
      </div>

      <div className="b2b-stats card">
        <div className="b2b-stats__item">
          <strong>3×</strong>
          <span className="muted small">{t("b2b.statRetention")}</span>
        </div>
        <div className="b2b-stats__item">
          <strong>14</strong>
          <span className="muted small">{t("b2b.statPilot")}</span>
        </div>
        <div className="b2b-stats__item">
          <strong>TG</strong>
          <span className="muted small">{t("b2b.statNative")}</span>
        </div>
      </div>

      <div className="card">
        <h2>{t("b2b.featuresTitle")}</h2>
        <ul className="b2b-features">
          {features.map((key) => (
            <li key={key} className="b2b-features__item">
              <span className="b2b-features__icon" aria-hidden>
                {key === "teams" ? "🏆" : key === "analytics" ? "📊" : key === "engagement" ? "🔥" : "🔒"}
              </span>
              <div>
                <strong>{t(`b2b.feature.${key}Title`)}</strong>
                <p className="muted small">{t(`b2b.feature.${key}Desc`)}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="card b2b-pricing">
        <h2>{t("b2b.pricingTitle")}</h2>
        <p className="muted">{t("b2b.pricingLead")}</p>
        <ul className="b2b-pricing__list">
          <li>{t("b2b.pricingStarter")}</li>
          <li>{t("b2b.pricingGrowth")}</li>
          <li>{t("b2b.pricingEnterprise")}</li>
        </ul>
      </div>

      <div className="card b2b-steps">
        <h2>{t("b2b.stepsTitle")}</h2>
        <ol className="b2b-steps__list">
          <li>{t("b2b.step1")}</li>
          <li>{t("b2b.step2")}</li>
          <li>{t("b2b.step3")}</li>
        </ol>
        <Link to="/org/admin" className="btn btn-secondary btn-block">
          {t("b2b.orgDashboard")}
        </Link>
      </div>

      <div className="card b2b-footer-cta">
        <h2>{t("b2b.footerTitle")}</h2>
        <p className="muted">{t("b2b.footerLead")}</p>
        <button type="button" className="btn btn-primary btn-block" onClick={() => openExternalLink(BOT_URL)}>
          {t("b2b.ctaBot")}
        </button>
      </div>
    </section>
  );
}
