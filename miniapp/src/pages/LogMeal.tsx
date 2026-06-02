import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "../api/client";
import { FoodSectionNav } from "../components/food/FoodSectionNav";
import { MealPhotoCapture, type MealPhotoAnalysis } from "../components/food/MealPhotoCapture";

export function LogMealPage() {
  const { t } = useTranslation();
  const [description, setDescription] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiNote, setAiNote] = useState<string | null>(null);
  const [captureError, setCaptureError] = useState<string | null>(null);

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
    setResult(null);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const res = await api.logMeal({
        description: description || "Meal",
        calories: Number(calories) || 0,
        protein: Number(protein) || 0,
        carbs: Number(carbs) || 0,
        fat: Number(fat) || 0,
        imageBase64: preview ?? undefined,
      });
      setResult(
        t("log.success", { points: res.points, team: res.teamPoints, streak: res.streak }),
      );
    } catch (err) {
      setResult((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="stack">
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

      <form className="card form" onSubmit={onSubmit}>
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
        <button type="submit" className="btn btn-primary btn-block" disabled={loading || analyzing}>
          {loading ? t("common.loading") : t("log.submit")}
        </button>
        {result && (
          <p className="success">
            {result}{" "}
            <Link to="/diary">{t("diary.viewAfterLog")}</Link>
          </p>
        )}
      </form>
    </section>
  );
}
