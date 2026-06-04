import { useTranslation } from "react-i18next";
import { NutriBirdGame } from "../components/game/NutriBirdGame";
import { NutriBirdMark } from "../components/game/NutriBirdMark";
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
        <NutriBirdMark size={84} showWordmark animated />
        <p className="muted small bird-game-hero-tagline">{t("game.subtitle")}</p>
      </div>
      <NutriBirdGame onActivity={refresh} />
    </section>
  );
}
