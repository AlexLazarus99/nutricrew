import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ensureWellnessTranslations } from "../i18n";
import { PageLoader } from "../components/PageLoader";
import { WellnessIllustration } from "../components/wellness/WellnessIllustration";
import { MuscleGroupSections, WarmupBlock, WeeklySplit } from "../components/wellness/MuscleGroupSections";
import { WeeklyMealPlan } from "../components/wellness/WeeklyMealPlan";
import { EXERCISE_GROUP_ORDER, type BodyTypeId, type DietId, type ExerciseId } from "../data/wellness/catalog";
import { useMe } from "../hooks/useMe";

type DetailParams = {
  category: string;
  id: string;
};

function BulletList({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <ul className="wellness-list">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

export function WellnessDetailPage() {
  const { category, id } = useParams<DetailParams>();
  const { t } = useTranslation();
  const { me } = useMe();
  const [wellnessReady, setWellnessReady] = useState(false);

  useEffect(() => {
    void ensureWellnessTranslations().then(() => setWellnessReady(true));
  }, []);

  if (!wellnessReady) {
    return <PageLoader />;
  }

  if (!category || !id || !["body", "diet", "exercise"].includes(category)) {
    return (
      <section className="card">
        <p>{t("common.error")}</p>
        <Link to="/guide">{t("wellness.back")}</Link>
      </section>
    );
  }

  const prefix =
    category === "body"
      ? `wellness.bodyTypes.${id}`
      : category === "diet"
        ? `wellness.diets.${id}`
        : `wellness.exercises.${id}`;

  const illustrationId = id as BodyTypeId | DietId | ExerciseId;
  const traits = asStringArray(t(`${prefix}.traits`, { returnObjects: true, defaultValue: [] }));
  const foods = asStringArray(t(`${prefix}.foods`, { returnObjects: true, defaultValue: [] }));
  const tips = asStringArray(t(`${prefix}.tips`, { returnObjects: true, defaultValue: [] }));
  const steps = asStringArray(t(`${prefix}.steps`, { returnObjects: true, defaultValue: [] }));

  return (
    <section className="stack wellness-detail">
      <Link to="/guide" className="wellness-back muted">
        ← {t("wellness.back")}
      </Link>

      <div className="card wellness-hero-card">
        {category !== "exercise" && (
          <WellnessIllustration id={illustrationId as BodyTypeId | DietId} className="wellness-hero-art" />
        )}
        <h2>{t(`${prefix}.name`)}</h2>
        <p className="muted">{t(`${prefix}.summary`)}</p>
        {category === "diet" && <span className="wellness-source">{t(`${prefix}.source`)}</span>}
      </div>

      {category === "body" && (
        <>
          <div className="card">
            <h3>{t("wellness.sections.traits")}</h3>
            <BulletList items={traits} />
          </div>
          <div className="card">
            <h3>{t("wellness.sections.nutrition")}</h3>
            <p>{t(`${prefix}.nutrition`)}</p>
            <p className="wellness-macro">{t(`${prefix}.macroHint`)}</p>
            <h4>{t("wellness.sections.foods")}</h4>
            <BulletList items={foods} />
          </div>
          <div className="card">
            <h3>{t("wellness.sections.activity")}</h3>
            <p>{t(`${prefix}.activity`)}</p>
          </div>
        </>
      )}

      {category === "diet" && (
        <>
          <div className="card">
            <p>{t(`${prefix}.description`)}</p>
          </div>
          <div className="card">
            <h3>{t("wellness.sections.macros")}</h3>
            <p className="wellness-macro">{t(`${prefix}.macros`)}</p>
          </div>
          <div className="card">
            <h3>{t("wellness.sections.foods")}</h3>
            <BulletList items={foods} />
          </div>
          <div className="card">
            <h3>{t("wellness.sections.evidence")}</h3>
            <p className="muted small">{t(`${prefix}.evidence`)}</p>
          </div>
          <WeeklyMealPlan dietId={id as DietId} previewOnly={!me.pro?.isPro} />
        </>
      )}

      {category === "exercise" && (
        <>
          <div className="card">
            <span className="wellness-badge">{t(`${prefix}.frequency`)}</span>
            <span className="wellness-badge">{t(`${prefix}.intensity`)}</span>
            {t(`${prefix}.split`, { defaultValue: "" }) && (
              <span className="wellness-source">{t(`${prefix}.split`)}</span>
            )}
            <p>{t(`${prefix}.description`)}</p>
          </div>

          <WarmupBlock prefix={prefix} />
          <WeeklySplit prefix={prefix} />

          <h3 className="muscle-groups-title">{t("wellness.sections.muscleGroups")}</h3>
          <MuscleGroupSections
            prefix={prefix}
            groupOrder={EXERCISE_GROUP_ORDER[id as ExerciseId] ?? []}
          />

          <div className="card">
            <h3>{t("wellness.sections.program")}</h3>
            <BulletList items={steps} />
          </div>
          <div className="card">
            <h3>{t("wellness.sections.tips")}</h3>
            <BulletList items={tips} />
          </div>
        </>
      )}

      <div className="card wellness-disclaimer">
        <p className="small muted">{t("wellness.disclaimer")}</p>
      </div>
    </section>
  );
}
