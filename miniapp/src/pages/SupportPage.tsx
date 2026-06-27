import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { SupportBadgeIcon } from "../components/support/SupportBadgeIcon";
import { useMe } from "../hooks/useMe";
import { openExternalLink } from "../lib/openExternalLink";
import { SocialLinks } from "../components/SocialLinks";

type FaqItem = { q: string; a: string };

const SUPPORT_EMAIL = "hello@nutricrew.app";
const SUPPORT_TELEGRAM = "https://t.me/ingritoo";

export function SupportPage() {
  const { t } = useTranslation();
  const { me } = useMe();
  const faq = t("support.faq", { returnObjects: true }) as FaqItem[];
  const botUser = me.botUsername?.replace(/^@/, "");
  const botUrl = botUser ? `https://t.me/${botUser}` : SUPPORT_TELEGRAM;

  return (
    <section className="stack support-page">
      <div className="card support-hero">
        <SupportBadgeIcon size={72} />
        <h2>{t("support.title")}</h2>
        <p className="muted">{t("support.lead")}</p>
      </div>

      <div className="card">
        <h3>{t("support.faqTitle")}</h3>
        <div className="support-faq">
          {Array.isArray(faq) &&
            faq.map((item, i) => (
              <details key={item.q} className="support-faq__item" open={i === 0}>
                <summary>{item.q}</summary>
                <p className="muted small">{item.a}</p>
              </details>
            ))}
        </div>
      </div>

      <div className="card">
        <h3>{t("support.contactTitle")}</h3>
        <p className="muted small">{t("support.contactHint")}</p>
        <button
          type="button"
          className="btn btn-primary btn-block"
          onClick={() => openExternalLink(botUrl)}
        >
          {t("support.openBot")}
        </button>
        <button
          type="button"
          className="btn btn-secondary btn-block"
          onClick={() => openExternalLink(SUPPORT_TELEGRAM)}
        >
          {t("support.writeTelegram")}
        </button>
        <button
          type="button"
          className="btn btn-secondary btn-block"
          onClick={() => openExternalLink(`mailto:${SUPPORT_EMAIL}`)}
        >
          {t("support.writeEmail")}
        </button>
        <Link to="/settings" className="btn btn-ghost btn-block">
          {t("support.backSettings")}
        </Link>
      </div>

      <SocialLinks links={me.socialLinks ?? {}} variant="card" />
    </section>
  );
}
