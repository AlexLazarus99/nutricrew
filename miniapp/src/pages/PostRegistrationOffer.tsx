import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMe } from "../hooks/useMe";
import { ensureWellnessTranslations } from "../i18n";
import { PageLoader } from "../components/PageLoader";
import { clearPostRegistrationOfferPending } from "../lib/postRegistration";
import { recommendWellness } from "../lib/wellnessRecommendations";
import { BODY_TYPE_STORAGE_KEY } from "../data/wellness/catalog";
import { WellnessIllustration } from "../components/wellness/WellnessIllustration";

type Props = {
  displayName?: string;
  onDismiss: () => void;
};

export function PostRegistrationOffer({ displayName, onDismiss }: Props) {
  const { t } = useTranslation();
  const { me } = useMe();
  const [wellnessReady, setWellnessReady] = useState(false);

  useEffect(() => {
    void ensureWellnessTranslations().then(() => setWellnessReady(true));
  }, []);

  const weight = me.weightKg ?? 70;
  const height = me.heightCm ?? 170;
  const age = me.age ?? 30;
  const rec = recommendWellness(weight, height, age);

  function dismiss() {
    localStorage.setItem(BODY_TYPE_STORAGE_KEY, rec.bodyType);
    clearPostRegistrationOfferPending();
    onDismiss();
  }

  const categoryLabel = t(`postRegistration.bmiCategory.${rec.category}` as const);
  const reasonKey = `postRegistration.reason.${rec.category}` as const;

  if (!wellnessReady) {
    return <PageLoader />;
  }

  return (
    <section className="stack post-registration">
      <div className="card hero post-registration-hero">
        <span className="wellness-badge">{t("postRegistration.badge")}</span>
        <h2>{t("postRegistration.title", { name: displayName ?? t("registration.friend") })}</h2>
        <p className="muted">{t("postRegistration.subtitle")}</p>
        <p className="post-registration-bmi">
          {t("postRegistration.bmiLine", { bmi: rec.bmi, category: categoryLabel })}
        </p>
        <p className="muted small">{t(reasonKey, { age })}</p>
      </div>

      <article className="card post-registration-rec">
        <span className="meal-slot-label">{t("postRegistration.dietHeading")}</span>
        <div className="post-registration-rec-row">
          <WellnessIllustration id={rec.diet} className="post-registration-art" />
          <div>
            <h3>{t(`wellness.diets.${rec.diet}.name`)}</h3>
            <p className="muted small">{t(`wellness.diets.${rec.diet}.summary`)}</p>
            <Link
              to={`/guide/diet/${rec.diet}`}
              className="btn btn-primary btn-block"
              onClick={dismiss}
            >
              {t("postRegistration.viewDiet")}
            </Link>
          </div>
        </div>
      </article>

      <article className="card post-registration-rec">
        <span className="meal-slot-label">{t("postRegistration.exerciseHeading")}</span>
        <div className="post-registration-rec-row">
          <div>
            <h3>{t(`wellness.exercises.${rec.exercise}.name`)}</h3>
            <p className="muted small">{t(`wellness.exercises.${rec.exercise}.summary`)}</p>
            <Link
              to={`/guide/exercise/${rec.exercise}`}
              className="btn btn-secondary btn-block"
              onClick={dismiss}
            >
              {t("postRegistration.viewExercise")}
            </Link>
          </div>
        </div>
      </article>

      <Link to="/guide" className="btn btn-secondary btn-block" onClick={dismiss}>
        {t("postRegistration.guideCta")}
      </Link>

      <button type="button" className="btn btn-ghost btn-block" onClick={dismiss}>
        {t("postRegistration.continue")}
      </button>
    </section>
  );
}
