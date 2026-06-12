import { useTranslation } from "react-i18next";

export function BirdGamePage() {
  const { t } = useTranslation();

  return (
    <section className="bird-quest-page" aria-label={t("nutriRun.title")}>
      <iframe
        src="/bird-quest.html"
        title={t("nutriRun.title")}
        className="bird-quest-frame"
        allow="autoplay"
      />
    </section>
  );
}
