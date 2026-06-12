import { useTranslation } from "react-i18next";
import { PipRunGame } from "../components/pipRun/PipRunGame";

export function BirdGamePage() {
  const { t } = useTranslation();

  return (
    <section className="stack piprun-page">
      <div className="card hero piprun-hero">
        <h1 className="piprun-logo">{t("nutriRun.title")}</h1>
        <p className="muted small">{t("nutriRun.tagline")}</p>
      </div>
      <PipRunGame />
    </section>
  );
}
