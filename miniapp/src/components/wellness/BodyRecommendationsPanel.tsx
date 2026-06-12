import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  exerciseIdsForBody,
  primaryDietForBody,
  primaryExerciseForBody,
  type BodyTypeId,
} from "../../data/wellness/catalog";
import { WellnessIllustration } from "./WellnessIllustration";

type Props = {
  bodyType: BodyTypeId;
  onOpenDiets?: () => void;
  onOpenExercises?: () => void;
};

export function BodyRecommendationsPanel({ bodyType, onOpenDiets, onOpenExercises }: Props) {
  const { t } = useTranslation();
  const diet = primaryDietForBody(bodyType);
  const exercises = exerciseIdsForBody(bodyType);
  const primaryExercise = primaryExerciseForBody(bodyType);

  return (
    <article key={bodyType} className="card wellness-recommend-panel">
      <p className="wellness-recommend-kicker">{t("wellness.recommendedKicker")}</p>
      <h3 className="wellness-recommend-title">
        {t("wellness.recommendedForYou", { body: t(`wellness.bodyTypes.${bodyType}.name`) })}
      </h3>

      <div className="wellness-recommend-grid">
        <Link to={`/guide/diet/${diet}`} className="wellness-recommend-item wellness-recommend-item--diet">
          <WellnessIllustration id={diet} />
          <div>
            <span className="wellness-recommend-badge">{t("wellness.recommendedBadge")}</span>
            <h4>{t("wellness.recommendedDiet")}</h4>
            <p className="wellness-recommend-name">{t(`wellness.diets.${diet}.name`)}</p>
            <p className="muted small">{t(`wellness.diets.${diet}.summary`)}</p>
          </div>
        </Link>

        <div className="wellness-recommend-item wellness-recommend-item--exercises">
          <div>
            <h4>{t("wellness.recommendedExercises")}</h4>
            <ul className="wellness-recommend-exercise-list">
              {exercises.map((id) => (
                <li key={id}>
                  <Link
                    to={`/guide/exercise/${id}`}
                    className={id === primaryExercise ? "wellness-recommend-exercise primary" : "wellness-recommend-exercise"}
                  >
                    <span className="wellness-recommend-exercise-name">{t(`wellness.exercises.${id}.name`)}</span>
                    {id === primaryExercise && (
                      <span className="wellness-recommend-badge">{t("wellness.recommendedBadge")}</span>
                    )}
                    <span className="muted small">{t(`wellness.exercises.${id}.frequency`)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="wellness-recommend-actions">
        <button type="button" className="btn btn-secondary" onClick={onOpenDiets}>
          {t("wellness.viewAllDiets")}
        </button>
        <button type="button" className="btn btn-primary" onClick={onOpenExercises}>
          {t("wellness.viewAllExercises")}
        </button>
      </div>
    </article>
  );
}
