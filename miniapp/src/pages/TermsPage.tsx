import { useTranslation } from "react-i18next";

export function TermsPage() {
  const { t } = useTranslation();
  const sections = t("legal.termsSections", { returnObjects: true }) as string[];

  return (
    <section className="card legal-page">
      <h2>{t("legal.termsTitle")}</h2>
      <p className="muted small">{t("legal.updated")}</p>
      {Array.isArray(sections) &&
        sections.map((paragraph, i) => (
          <p key={i} className="legal-paragraph">
            {paragraph}
          </p>
        ))}
    </section>
  );
}
