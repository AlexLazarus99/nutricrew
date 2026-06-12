import { useTranslation } from "react-i18next";
import { NutriBirdMark } from "../components/game/NutriBirdMark";

export function BirdGamePage() {
  const { t } = useTranslation();

  return (
    <section className="stack bird-game-page">
      <div className="card hero bird-game-hero">
        <NutriBirdMark size={84} showWordmark animated />
        <p className="muted small bird-game-hero-tagline">{t("game.subtitle")}</p>
      </div>
      <div className="card bird-game-placeholder">
        <h2>{t("game.comingSoonTitle")}</h2>
        <p className="muted">{t("game.comingSoonBody")}</p>
      </div>
    </section>
  );
}
