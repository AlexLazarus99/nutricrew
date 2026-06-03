import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api, type MealResponse } from "../api/client";
import { MealShareCard } from "../components/MealShareCard";
import { TutorialCoach } from "../components/TutorialCoach";
import { useTutorialTour } from "../hooks/useTutorialTour";
import { useMe } from "../hooks/useMe";
import { FoodSectionNav } from "../components/food/FoodSectionNav";
import { MealPhotoCapture, type MealPhotoAnalysis } from "../components/food/MealPhotoCapture";
import { clearMealDraft, loadMealDraft, saveMealDraft } from "../lib/offlineMealDraft";

export function LogMealPage() {
  const { t } = useTranslation();
  const { me, refresh } = useMe();
  const logTour = useTutorialTour("log", true);
  const [description, setDescription] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [mealResult, setMealResult] = useState<MealResponse | null>(null);
  const [resultError, setResultError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiNote, setAiNote] = useState<string | null>(null);
  const [captureError, setCaptureError] = useState<string | null>(null);
  const [qualityTag, setQualityTag] = useState("balanced");
  const [mealSlot, setMealSlot] = useState("");
  const [favoriteId, setFavoriteId] = useState<string | undefined>();
  const [draftNote, setDraftNote] = useState<string | null>(null);

  const favorites = me.growth?.favorites ?? [];

  useEffect(() => {
    const draft = loadMealDraft();
    if (draft) {
      setDescription(draft.description);
      setCalories(draft.calories);
      setProtein(draft.protein);
      setCarbs(draft.carbs);
      setFat(draft.fat);
      setQualityTag(draft.qualityTag || "balanced");
      setMealSlot(draft.mealSlot || "");
      setDraftNote(t("log.draftRestored"));
    }
  }, [t]);

  useEffect(() => {
    saveMealDraft({
      description,
      calories,
      protein,
      carbs,
      fat,
      qualityTag,
      mealSlot,
    });
  }, [description, calories, protein, carbs, fat, qualityTag, mealSlot]);

  function applyAnalysis(analysis: MealPhotoAnalysis) {
    setCaptureError(null);
    setPreview(analysis.preview);
    setDescription(analysis.description);
    setCalories(String(analysis.calories));
    setProtein(String(analysis.protein));
    setCarbs(String(analysis.carbs));
    setFat(String(analysis.fat));
    setAiNote(
      t("log.aiNote", {
        confidence: Math.round(analysis.confidence * 100),
        source: analysis.source,
      }),
    );
    setMealResult(null);
    setResultError(null);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMealResult(null);
    setResultError(null);
    try {
      const res = await api.logMeal({
        description: description || "Meal",
        calories: Number(calories) || 0,
        protein: Number(protein) || 0,
        carbs: Number(carbs) || 0,
        fat: Number(fat) || 0,
        imageBase64: preview ?? undefined,
        mealSlot: mealSlot || undefined,
        qualityTag: qualityTag || undefined,
        favoriteId,
      });
      setMealResult(res);
      clearMealDraft();
      setFavoriteId(undefined);
      await refresh();
    } catch (err) {
      setResultError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="stack">
      <TutorialCoach {...logTour} />
      <FoodSectionNav />
      <div className="card">
        <h2>{t("log.title")}</h2>
        <p className="muted">{t("log.hint")}</p>
        <MealPhotoCapture
          analyzing={analyzing}
          preview={preview}
          aiNote={aiNote}
          onAnalyzingChange={setAnalyzing}
          onAnalysis={applyAnalysis}
          onError={setCaptureError}
        />
        {captureError && <p className="error-text">{captureError}</p>}
      </div>

      {draftNote && <p className="muted small">{draftNote}</p>}

      {favorites.length > 0 && (
        <div className="card">
          <h3>{t("log.favoritesTitle")}</h3>
          <ul className="favorites-list">
            {favorites.slice(0, 5).map((f) => (
              <li key={f.id} className="favorite-item">
                <span>
                  {f.description} · {f.calories} kcal
                </span>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setDescription(f.description);
                    setCalories(String(f.calories));
                    setProtein(String(f.protein));
                    setCarbs(String(f.carbs));
                    setFat(String(f.fat));
                    setFavoriteId(f.id);
                  }}
                >
                  →
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="card">
        <p className="muted small">{t("log.barcodeSoon")}</p>
        <button
          type="button"
          className="btn btn-secondary btn-block"
          onClick={() => {
            const text = window.prompt(t("log.voicePrompt"));
            if (text) setDescription(text);
          }}
        >
          {t("log.voiceLog")}
        </button>
      </div>

      <form className="card form" onSubmit={onSubmit}>
        <p className="form-macros-label">{t("log.qualityTitle")}</p>
        <div className="feature-row">
          {(["balanced", "light", "treat", "water"] as const).map((q) => (
            <button
              key={q}
              type="button"
              className={`feature-chip ${qualityTag === q ? "active" : ""}`}
              onClick={() => setQualityTag(q)}
            >
              {t(`log.quality_${q}`)}
            </button>
          ))}
        </div>
        <p className="form-macros-label">{t("log.slotTitle")}</p>
        <div className="feature-row">
          {(["breakfast", "lunch", "dinner", "snack"] as const).map((s) => (
            <button
              key={s}
              type="button"
              className={`feature-chip ${mealSlot === s ? "active" : ""}`}
              onClick={() => setMealSlot(mealSlot === s ? "" : s)}
            >
              {t(`log.slot_${s}`)}
            </button>
          ))}
        </div>
        <label>
          {t("log.description")}
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Oatmeal & eggs"
            required
          />
        </label>
        <label>
          {t("log.calories")}
          <input
            type="number"
            min={0}
            value={calories}
            onChange={(e) => setCalories(e.target.value)}
            required
          />
        </label>
        <p className="form-macros-label">{t("log.macros")}</p>
        <div className="form-macros">
          <label>
            {t("log.protein")}
            <input
              type="number"
              min={0}
              value={protein}
              onChange={(e) => setProtein(e.target.value)}
              required
            />
          </label>
          <label>
            {t("log.carbs")}
            <input
              type="number"
              min={0}
              value={carbs}
              onChange={(e) => setCarbs(e.target.value)}
              required
            />
          </label>
          <label>
            {t("log.fat")}
            <input
              type="number"
              min={0}
              value={fat}
              onChange={(e) => setFat(e.target.value)}
              required
            />
          </label>
        </div>
        <button
          type="submit"
          className="btn btn-primary btn-block"
          disabled={loading || analyzing}
          data-tutorial="log-submit"
        >
          {loading ? t("common.loading") : t("log.submit")}
        </button>
        {resultError && <p className="error-text">{resultError}</p>}
      </form>

      {mealResult && (
        <>
          <MealShareCard
            points={mealResult.points}
            teamPoints={mealResult.teamPoints}
            streak={mealResult.streak}
            inviteUrl={mealResult.inviteUrl}
          />
          <Link to="/diary" className="btn btn-secondary btn-block">
            {t("diary.viewAfterLog")}
          </Link>
        </>
      )}
    </section>
  );
}
