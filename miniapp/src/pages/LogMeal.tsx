import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api, type MealAnalysisResponse, type MealResponse } from "../api/client";
import { trackEvent } from "../lib/analytics";
import { MealShareCard } from "../components/MealShareCard";
import { TutorialCoach } from "../components/TutorialCoach";
import { useTutorialTour } from "../hooks/useTutorialTour";
import { useMe } from "../hooks/useMe";
import { FoodSectionNav } from "../components/food/FoodSectionNav";
import { MealPhotoCapture, type MealPhotoAnalysis } from "../components/food/MealPhotoCapture";
import { BarcodeScanner } from "../components/food/BarcodeScanner";
import { FoodCatalogPicker } from "../components/food/FoodCatalogPicker";
import { clearMealDraft, loadMealDraft, saveMealDraft } from "../lib/offlineMealDraft";
import { FoodLogHero } from "../components/food/FoodLogHero";
import { VoiceMealLog } from "../components/food/VoiceMealLog";

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
  const [lastAnalysis, setLastAnalysis] = useState<MealAnalysisResponse | null>(null);
  const [barcodeOpen, setBarcodeOpen] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [voiceOpen, setVoiceOpen] = useState(false);

  const [favorites, setFavorites] = useState<
    Array<{
      id: string;
      description: string;
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      useCount: number;
    }>
  >([]);

  useEffect(() => {
    void api
      .getGrowth()
      .then((g) => setFavorites(g.favorites))
      .catch(() => {});
  }, []);

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

  const MEAL_SLOTS = ["breakfast", "lunch", "dinner", "snack"] as const;

  function applyMealEstimate(
    analysis: MealAnalysisResponse,
    options?: { preview?: string | null; clearPreview?: boolean },
  ) {
    setCaptureError(null);
    setLastAnalysis(analysis);
    if (options?.clearPreview) {
      setPreview(null);
    } else if (options?.preview !== undefined) {
      setPreview(options.preview);
    }
    setDescription(analysis.description);
    setCalories(String(analysis.calories));
    setProtein(String(analysis.protein));
    setCarbs(String(analysis.carbs));
    setFat(String(analysis.fat));
    if (
      analysis.mealType &&
      (MEAL_SLOTS as readonly string[]).includes(analysis.mealType)
    ) {
      setMealSlot(analysis.mealType);
    } else if (analysis.mealType === "drink") {
      setMealSlot("snack");
    }

    if (analysis.source === "fallback") {
      const reasonKey =
        analysis.visionReason === "no_key"
          ? "log.aiFallbackNoKey"
          : analysis.visionReason === "api_error"
            ? "log.aiFallbackApiError"
            : "log.aiFallbackParseError";
      const hint = analysis.visionHint?.trim();
      setAiNote(hint ? `${t(reasonKey)} ${hint}` : t(reasonKey));
    } else if (analysis.source === "catalog") {
      setAiNote(t("log.sourceCatalog"));
    } else if (analysis.source === "barcode") {
      const barcodeSrc = (analysis as { barcodeDataSource?: string }).barcodeDataSource;
      const noteKey =
        barcodeSrc === "ru_catalog"
          ? "log.sourceBarcodeRu"
          : barcodeSrc === "off_ru"
            ? "log.sourceBarcodeOffRu"
            : "log.sourceBarcodeOff";
      setAiNote(t(noteKey));
    } else if (analysis.source === "photo_only") {
      setAiNote(t("log.sourcePhotoOnly"));
    } else if (analysis.source === "voice") {
      setAiNote(
        analysis.visionReason === "no_key" || analysis.visionReason === "api_error"
          ? t(
              analysis.visionReason === "no_key"
                ? "log.aiFallbackNoKey"
                : "log.aiFallbackApiError",
            )
          : t("log.sourceVoice", { confidence: Math.round(analysis.confidence * 100) }),
      );
    } else if (analysis.source === "barcode_ai") {
      setAiNote(t("log.sourceBarcodeAi", { confidence: Math.round(analysis.confidence * 100) }));
    } else if (analysis.source === "claude") {
      setAiNote(
        t("log.aiNote", {
          confidence: Math.round(analysis.confidence * 100),
          source: "claude",
        }),
      );
    } else {
      setAiNote(
        t("log.aiNote", {
          confidence: Math.round(analysis.confidence * 100),
          source: analysis.source,
        }),
      );
    }
    setMealResult(null);
    setResultError(null);
  }

  function applyAnalysis(analysis: MealPhotoAnalysis) {
    applyMealEstimate(analysis, { preview: analysis.preview });
  }

  function applyPhotoOnly(previewUrl: string) {
    applyMealEstimate(
      {
        description: description || t("log.photoOnlyDefault"),
        calories: Number(calories) || 0,
        protein: Number(protein) || 0,
        carbs: Number(carbs) || 0,
        fat: Number(fat) || 0,
        confidence: 1,
        source: "photo_only",
      },
      { preview: previewUrl },
    );
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
        analysis: lastAnalysis ?? undefined,
      });
      trackEvent("meal_logged", { calories: Number(calories) || 0 });
      setMealResult(res);
      setLastAnalysis(null);
      clearMealDraft();
      setFavoriteId(undefined);
      await refresh();
    } catch (err) {
      const msg = (err as Error).message;
      const known = ["NOT_FOOD", "DUPLICATE_PHOTO", "MACRO_OUT_OF_RANGE", "ANALYZE_LIMIT"];
      setResultError(known.includes(msg) ? t(`log.error_${msg}`) : msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="stack log-page">
      <TutorialCoach {...logTour} />
      <FoodSectionNav />
      <FoodLogHero
        progress={me.progress}
        titleKey="log.title"
        subtitleKey="log.hint"
      />
      <div className="card log-section log-section--capture">
        <MealPhotoCapture
          analyzing={analyzing}
          preview={preview}
          aiNote={aiNote}
          onAnalyzingChange={setAnalyzing}
          onAnalysis={applyAnalysis}
          onPhotoOnly={applyPhotoOnly}
          onError={setCaptureError}
        />
        {captureError && <p className="error-text">{captureError}</p>}
      </div>

      {draftNote && <p className="muted small">{draftNote}</p>}

      {favorites.length > 0 && (
        <div className="card log-section log-section--favorites">
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

      <div className="card meal-quick-entry log-section log-section--quick">
        <h3>{t("log.quickEntryTitle")}</h3>
        <p className="muted small">{t("log.quickEntryHint")}</p>
        <div className="meal-quick-entry__actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setCatalogOpen(false);
              setBarcodeOpen(true);
            }}
          >
            {t("log.barcodeScan")}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setBarcodeOpen(false);
              setCatalogOpen(true);
            }}
          >
            {t("log.catalogOpen")}
          </button>
        </div>
        <button
          type="button"
          className={`btn btn-secondary btn-block ${voiceOpen ? "active" : ""}`}
          onClick={() => {
            setBarcodeOpen(false);
            setCatalogOpen(false);
            setVoiceOpen((v) => !v);
          }}
        >
          {t("log.voiceLog")}
        </button>
      </div>

      {voiceOpen && (
        <div className="card log-section">
          <VoiceMealLog
            onApply={(result) => {
              setVoiceOpen(false);
              applyMealEstimate(result, { clearPreview: true });
            }}
          />
        </div>
      )}

      {barcodeOpen && (
        <div className="card">
          <BarcodeScanner
            onApply={(result) => {
              setBarcodeOpen(false);
              applyMealEstimate(result, { clearPreview: true });
            }}
            onClose={() => setBarcodeOpen(false)}
          />
        </div>
      )}

      {catalogOpen && (
        <div className="card">
          <FoodCatalogPicker
            onApply={(result) => {
              setCatalogOpen(false);
              applyMealEstimate(result, { clearPreview: true });
            }}
            onClose={() => setCatalogOpen(false)}
          />
        </div>
      )}

      <form className="card form log-section log-section--form" onSubmit={onSubmit}>
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
          className={`btn btn-primary btn-block${loading ? " btn--loading" : ""}`}
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
            progress={me.progress}
          />
          <Link to="/diary" className="btn btn-secondary btn-block">
            {t("diary.viewAfterLog")}
          </Link>
        </>
      )}
    </section>
  );
}
