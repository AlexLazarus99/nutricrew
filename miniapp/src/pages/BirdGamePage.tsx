import { useTranslation } from "react-i18next";
import { NutriBirdGame } from "../components/game/NutriBirdGame";

export function BirdGamePage() {
  const { t } = useTranslation();

  return (
    <section className="stack bird-game-page">
      <div className="card hero bird-game-hero">
        <h2>{t("game.title")}</h2>
        <p className="muted small">{t("game.subtitle")}</p>
      </div>
      <NutriBirdGame />
    </section>
  );
}
