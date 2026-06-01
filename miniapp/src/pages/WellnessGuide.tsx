import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { WellnessIllustration } from "../components/wellness/WellnessIllustration";
import { CalorieCalculator } from "../components/wellness/CalorieCalculator";
import {
  BODY_TYPES,
  BODY_TYPE_STORAGE_KEY,
  DIETS,
  exerciseIdsForBody,
  type BodyTypeId,
} from "../data/wellness/catalog";

type Tab = "body" | "diets" | "exercises" | "calc";

export function WellnessGuidePage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get("tab");
  const [tab, setTab] = useState<Tab>(() => {
    if (initialTab === "calc" || initialTab === "body" || initialTab === "diets" || initialTab === "exercises") {
      return initialTab;
    }
    return "body";
  });
  const [selectedBody, setSelectedBody] = useState<BodyTypeId>(() => {
    const saved = localStorage.getItem(BODY_TYPE_STORAGE_KEY);
    return BODY_TYPES.includes(saved as BodyTypeId) ? (saved as BodyTypeId) : "mesomorph";
  });

  useEffect(() => {
    localStorage.setItem(BODY_TYPE_STORAGE_KEY, selectedBody);
  }, [selectedBody]);

  useEffect(() => {
    const q = searchParams.get("tab");
    if (q === "calc" || q === "body" || q === "diets" || q === "exercises") {
      setTab(q);
    }
  }, [searchParams]);

  return (
    <section className="stack wellness">
      <div className="card hero">
        <h2>{t("wellness.title")}</h2>
        <p className="muted">{t("wellness.subtitle")}</p>
      </div>

      <div className="wellness-tabs wellness-tabs-4" role="tablist">
        {(["body", "diets", "exercises", "calc"] as Tab[]).map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            className={tab === key ? "active" : ""}
            onClick={() => setTab(key)}
          >
            {t(`wellness.tabs.${key}`)}
          </button>
        ))}
      </div>

      {tab === "body" && (
        <div className="wellness-grid">
          {BODY_TYPES.map((id) => (
            <article key={id} className={`wellness-card ${selectedBody === id ? "selected" : ""}`}>
              <WellnessIllustration id={id} />
              <h3>{t(`wellness.bodyTypes.${id}.name`)}</h3>
              <p className="muted small">{t(`wellness.bodyTypes.${id}.summary`)}</p>
              <div className="wellness-tags">
                <span>{t(`wellness.bodyTypes.${id}.macroHint`)}</span>
              </div>
              <div className="wellness-card-actions">
                <button
                  type="button"
                  className={`btn btn-secondary ${selectedBody === id ? "active-pick" : ""}`}
                  onClick={() => setSelectedBody(id)}
                >
                  {selectedBody === id ? t("wellness.selected") : t("wellness.selectBody")}
                </button>
                <Link to={`/guide/body/${id}`} className="btn btn-primary">
                  {t("wellness.readMore")}
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}

      {tab === "diets" && (
        <div className="wellness-grid">
          {DIETS.map((id) => (
            <Link key={id} to={`/guide/diet/${id}`} className="wellness-card wellness-card-link">
              <WellnessIllustration id={id} />
              <h3>{t(`wellness.diets.${id}.name`)}</h3>
              <p className="muted small">{t(`wellness.diets.${id}.summary`)}</p>
              <span className="wellness-source">{t(`wellness.diets.${id}.source`)}</span>
            </Link>
          ))}
        </div>
      )}

      {tab === "exercises" && (
        <>
          <p className="muted wellness-note">
            {t("wellness.exerciseForBody", { body: t(`wellness.bodyTypes.${selectedBody}.name`) })}
          </p>
          <div className="wellness-grid">
            {exerciseIdsForBody(selectedBody).map((id) => (
              <Link key={id} to={`/guide/exercise/${id}`} className="wellness-card wellness-card-link">
                <h3>{t(`wellness.exercises.${id}.name`)}</h3>
                <p className="muted small">{t(`wellness.exercises.${id}.summary`)}</p>
                <p className="muted small exercise-card-desc">{t(`wellness.exercises.${id}.description`)}</p>
                <div className="wellness-tags">
                  <span className="wellness-badge">{t(`wellness.exercises.${id}.frequency`)}</span>
                  {t(`wellness.exercises.${id}.split`, { defaultValue: "" }) && (
                    <span className="wellness-source">{t(`wellness.exercises.${id}.split`)}</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </>
      )}

      {tab === "calc" && <CalorieCalculator />}

      <div className="card wellness-disclaimer">
        <p className="small muted">{t("wellness.disclaimer")}</p>
        <p className="small muted">{t("wellness.sources")}</p>
      </div>
    </section>
  );
}
