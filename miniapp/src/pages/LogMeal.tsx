import { FormEvent, useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
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
import { FoodDayActions } from "../components/food/FoodDayActions";
import { GuestModeBanner } from "../components/food/GuestModeBanner";
import { FoodSearchPanel } from "../components/food/FoodSearchPanel";
import { NutritionNotesPanel } from "../components/food/NutritionNotesPanel";
import type { FoodSearchResult } from "../api/client";
import { VoiceMealLog } from "../components/food/VoiceMealLog";
import { incrementMealLogCount } from "../lib/guestSession";
import { maybeScheduleGuideOffer } from "../lib/postRegistration";
import { parseLogCameraMode } from "../lib/logCameraPath";

type AnalysisPortionBase = {
  servingGrams: number;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

function resolveServingGrams(analysis: MealAnalysisResponse): number | undefined {
  if (analysis.servingGrams && analysis.servingGrams > 0) return analysis.servingGrams;
  const portionAmount = (analysis as { portionAmount?: number }).portionAmount;
  if (portionAmount && portionAmount > 0) return portionAmount;
  const barcodeGrams = (analysis as { servingGrams?: number }).servingGrams;
  return barcodeGrams && barcodeGrams > 0 ? barcodeGrams : undefined;
}

export function LogMealPage() {
  const { t } = useTranslation();
  const { me, refresh } = useMe();
  const [searchParams] = useSearchParams();
  const autoCamera = parseLogCameraMode(searchParams.get("camera"));
  const liveCameraEntry = autoCamera === "live";
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
  const [nutritionRemarks, setNutritionRemarks] = useState<string[]>([]);
  const [encyclopediaNote, setEncyclopediaNote] = useState<string | null>(null);
  const [captureError, setCaptureError] = useState<string | null>(null);
  const [qualityTag, setQualityTag] = useState("balanced");
  const [mealSlot, setMealSlot] = useState("");
  const [favoriteId, setFavoriteId] = useState<string | undefined>();
  const [draftNote, setDraftNote] = useState<string | null>(null);
  const [lastAnalysis, setLastAnalysis] = useState<MealAnalysisResponse | null>(null);
  const [barcodeOpen, setBarcodeOpen] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [showMoreWays, setShowMoreWays] = useState(false);
  const [showPhotoCapture, setShowPhotoCapture] = useState(!!autoCamera);
  const [liveScannerOpen, setLiveScannerOpen] = useState(liveCameraEntry);
  const [portionGrams, setPortionGrams] = useState("");
  const analysisBaseRef = useRef<AnalysisPortionBase | null>(null);
  const photoSectionRef = useRef<HTMLDivElement | null>(null);

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
    if (!me.profileComplete || liveCameraEntry) return;
    void api
      .getGrowth()
      .then((g) => setFavorites(g.favorites))
      .catch(() => {});
  }, [me.profileComplete, liveCameraEntry]);

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

  function withPortionNote(note: string, grams?: number) {
    if (!grams) return note;
    return `${note} · ${t("log.aiPortionNote", { grams })}`;
  }

  function handlePortionGramsChange(value: string) {
    setPortionGrams(value);
    const base = analysisBaseRef.current;
    const grams = Number(value);
    if (!base || !grams || grams <= 0) return;

    const ratio = grams / base.servingGrams;
    setCalories(String(Math.round(base.calories * ratio)));
    setProtein(String(Math.round(base.protein * ratio)));
    setCarbs(String(Math.round(base.carbs * ratio)));
    setFat(String(Math.round(base.fat * ratio)));

    const descBase = base.description
      .replace(new RegExp(String.raw`\s*\(\d+(?:[.,]\d+)?\s*g\)\s*$`, "i"), "")
      .trim();
    setDescription(`${descBase} (${Math.round(grams)} g)`);
    setLastAnalysis((prev) => (prev ? { ...prev, servingGrams: Math.round(grams) } : prev));
  }

  function applyMealEstimate(
    analysis: MealAnalysisResponse,
    options?: { preview?: string | null; clearPreview?: boolean },
  ) {
    setCaptureError(null);
    if (options?.clearPreview) {
      setPreview(null);
    } else if (options?.preview !== undefined) {
      setPreview(options.preview);
    }
    const servingGrams = resolveServingGrams(analysis);
    const normalizedAnalysis = servingGrams
      ? { ...analysis, servingGrams }
      : analysis;

    setDescription(normalizedAnalysis.description);
    setCalories(String(normalizedAnalysis.calories));
    setProtein(String(normalizedAnalysis.protein));
    setCarbs(String(normalizedAnalysis.carbs));
    setFat(String(normalizedAnalysis.fat));

    if (servingGrams) {
      analysisBaseRef.current = {
        servingGrams,
        description: normalizedAnalysis.description,
        calories: normalizedAnalysis.calories,
        protein: normalizedAnalysis.protein,
        carbs: normalizedAnalysis.carbs,
        fat: normalizedAnalysis.fat,
      };
      setPortionGrams(String(servingGrams));
    } else {
      analysisBaseRef.current = null;
      setPortionGrams("");
    }

    if (
      analysis.mealType &&
      (MEAL_SLOTS as readonly string[]).includes(analysis.mealType)
    ) {
      setMealSlot(analysis.mealType);
    } else if (analysis.mealType === "drink") {
      setMealSlot("snack");
    }

    if (normalizedAnalysis.source === "fallback") {
      const reasonKey =
        normalizedAnalysis.visionReason === "no_key"
          ? "log.aiFallbackNoKey"
          : normalizedAnalysis.visionReason === "api_error"
            ? "log.aiFallbackApiError"
            : "log.aiFallbackParseError";
      const hint = normalizedAnalysis.visionHint?.trim();
      setAiNote(
        withPortionNote(
          hint ? `${t(reasonKey)} ${hint}` : t(reasonKey),
          servingGrams,
        ),
      );
    } else if (normalizedAnalysis.source === "catalog") {
      setAiNote(withPortionNote(t("log.sourceCatalog"), servingGrams));
    } else if (normalizedAnalysis.source === "barcode") {
      const barcodeSrc = (normalizedAnalysis as { barcodeDataSource?: string }).barcodeDataSource;
      const noteKey =
        barcodeSrc === "ru_catalog"
          ? "log.sourceBarcodeRu"
          : barcodeSrc === "off_ru"
            ? "log.sourceBarcodeOffRu"
            : "log.sourceBarcodeOff";
      setAiNote(withPortionNote(t(noteKey), servingGrams));
    } else if (normalizedAnalysis.source === "photo_only") {
      setAiNote(t("log.sourcePhotoOnly"));
    } else if (normalizedAnalysis.source === "voice") {
      setAiNote(
        withPortionNote(
          normalizedAnalysis.visionReason === "no_key" ||
            normalizedAnalysis.visionReason === "api_error"
            ? t(
                normalizedAnalysis.visionReason === "no_key"
                  ? "log.aiFallbackNoKey"
                  : "log.aiFallbackApiError",
              )
            : t("log.sourceVoice", {
                confidence: Math.round(normalizedAnalysis.confidence * 100),
              }),
          servingGrams,
        ),
      );
    } else if (normalizedAnalysis.source === "barcode_ai") {
      setAiNote(
        withPortionNote(
          t("log.sourceBarcodeAi", {
            confidence: Math.round(normalizedAnalysis.confidence * 100),
          }),
          servingGrams,
        ),
      );
    } else if (normalizedAnalysis.source === "claude") {
      setAiNote(
        withPortionNote(
          t("log.aiNote", {
            confidence: Math.round(normalizedAnalysis.confidence * 100),
            source: "claude",
          }),
          servingGrams,
        ),
      );
    } else {
      setAiNote(
        withPortionNote(
          t("log.aiNote", {
            confidence: Math.round(normalizedAnalysis.confidence * 100),
            source: normalizedAnalysis.source,
          }),
          servingGrams,
        ),
      );
    }
    setLastAnalysis(normalizedAnalysis);
    setMealResult(null);
    setResultError(null);
    setNutritionRemarks(normalizedAnalysis.nutritionRemarks ?? []);
    setEncyclopediaNote(normalizedAnalysis.encyclopediaNote ?? null);
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
      const count = incrementMealLogCount();
      maybeScheduleGuideOffer(count, me.profileComplete);
      setMealResult(res);
      setLastAnalysis(null);
      setNutritionRemarks([]);
      setEncyclopediaNote(null);
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

  function openPhotoCapture() {
    setBarcodeOpen(false);
    setCatalogOpen(false);
    setShowPhotoCapture(true);
    requestAnimationFrame(() => {
      photoSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }

  const showCaptureUi = showPhotoCapture || !!preview || analyzing;
  const hideLogChrome = liveCameraEntry && liveScannerOpen && !preview && !analyzing;
  const captureBlock = showCaptureUi ? (
    <div ref={photoSectionRef} className="card log-section log-section--capture">
      <MealPhotoCapture
        analyzing={analyzing}
        preview={preview}
        aiNote={aiNote}
        autoStart={autoCamera}
        onLiveOpenChange={setLiveScannerOpen}
        onAnalyzingChange={setAnalyzing}
        onAnalysis={applyAnalysis}
        onPhotoOnly={applyPhotoOnly}
        onError={setCaptureError}
      />
      {captureError && <p className="error-text">{captureError}</p>}
    </div>
  ) : null;

  return (
    <section className={`stack log-page${hideLogChrome ? " log-page--camera-first" : ""}`}>
      {hideLogChrome && captureBlock}

      {!hideLogChrome && <TutorialCoach {...logTour} />}
      {!hideLogChrome && <FoodSectionNav />}
      {!hideLogChrome && (
        <FoodLogHero
          progress={me.progress}
          titleKey="home.logCta"
          subtitleKey="log.hint"
          compactBadge
        />
      )}

      {!me.profileComplete && !hideLogChrome && <GuestModeBanner hasTeam={!!me.teamId} />}

      {!hideLogChrome && (
        <FoodDayActions
          scanning={barcodeOpen || analyzing}
          photoOpen={showCaptureUi}
          onScan={() => {
            setCatalogOpen(false);
            setBarcodeOpen(true);
          }}
          onPhoto={openPhotoCapture}
        />
      )}

      {barcodeOpen && (
        <div className="card log-section">
          <BarcodeScanner
            hasTeam={!!me.teamId}
            onApply={(result) => {
              setBarcodeOpen(false);
              applyMealEstimate(result, { clearPreview: true });
            }}
            onClose={() => setBarcodeOpen(false)}
          />
        </div>
      )}

      {!hideLogChrome && captureBlock}

      {draftNote && <p className="muted small">{draftNote}</p>}

      <details
        className="card log-more-ways"
        open={showMoreWays}
        onToggle={(e) => setShowMoreWays((e.target as HTMLDetailsElement).open)}
      >
        <summary>{t("log.moreWaysTitle")}</summary>
        <p className="muted small">{t("log.quickEntryHint")}</p>

        {favorites.length > 0 && (
          <div className="log-section log-section--favorites">
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

        <FoodSearchPanel
          onSelect={(item: FoodSearchResult) => {
            applyMealEstimate(
              {
                description: item.name,
                calories: item.calories,
                protein: item.protein,
                carbs: item.carbs,
                fat: item.fat,
                servingGrams: item.servingGrams,
                confidence: 0.9,
                source: "catalog",
                nutritionRemarks: item.nutritionRemarks,
                encyclopediaNote: item.encyclopediaNote,
              },
              { clearPreview: true },
            );
          }}
        />

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

        {voiceOpen && (
          <VoiceMealLog
            onApply={(result) => {
              setVoiceOpen(false);
              applyMealEstimate(result, { clearPreview: true });
            }}
          />
        )}

        {catalogOpen && (
          <FoodCatalogPicker
            onApply={(result) => {
              setCatalogOpen(false);
              applyMealEstimate(result, { clearPreview: true });
            }}
            onClose={() => setCatalogOpen(false)}
          />
        )}
      </details>

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
        <NutritionNotesPanel remarks={nutritionRemarks} encyclopedia={encyclopediaNote ?? undefined} />
        {portionGrams && (
          <label>
            {t("log.portionGrams")}
            <input
              type="number"
              min={1}
              max={3000}
              value={portionGrams}
              onChange={(e) => handlePortionGramsChange(e.target.value)}
            />
            <span className="muted small">{t("log.portionAdjustHint")}</span>
          </label>
        )}
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
          {mealResult.microFeedback && (
            <div className="card meal-micro-feedback">
              <p className="meal-micro-feedback__label">{t("log.microFeedbackTitle")}</p>
              <p className="meal-micro-feedback__text">{mealResult.microFeedback}</p>
            </div>
          )}
          <Link to="/diary" className="btn btn-secondary btn-block">
            {t("diary.viewAfterLog")}
          </Link>
        </>
      )}
    </section>
  );
}
