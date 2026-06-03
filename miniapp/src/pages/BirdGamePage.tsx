import { useTranslation } from "react-i18next";
import { NutriBirdGame } from "../components/game/NutriBirdGame";
import { TutorialCoach } from "../components/TutorialCoach";
import { useTutorialTour } from "../hooks/useTutorialTour";
import { useMe } from "../hooks/useMe";

export function BirdGamePage() {
  const { t } = useTranslation();
  const { refresh } = useMe();
  const gameTour = useTutorialTour("game", true);

  return (
    <section className="stack bird-game-page">
      <TutorialCoach {...gameTour} />
      <div className="card hero bird-game-hero">
        <h2>{t("game.title")}</h2>
        <p className="muted small">{t("game.subtitle")}</p>
      </div>
      <NutriBirdGame onActivity={refresh} />
    </section>
  );
}
