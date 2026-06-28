import { ChangeEvent, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { api, type MealAnalysisResponse } from "../../api/client";
import { fileToDataUrl } from "../../lib/imageCapture";
import { MealLiveScanner } from "./MealLiveScanner";

export type MealPhotoAnalysis = MealAnalysisResponse & { preview: string };

type Props = {
  analyzing: boolean;
  preview: string | null;
  aiNote: string | null;
  autoStart?: "live" | "capture" | null;
  onLiveOpenChange?: (open: boolean) => void;
  onAnalyzingChange: (value: boolean) => void;
  onAnalysis: (result: MealPhotoAnalysis) => void;
  onPhotoOnly: (preview: string) => void;
  onError: (message: string) => void;
};

export function MealPhotoCapture({
  analyzing,
  preview,
  aiNote,
  autoStart,
  onLiveOpenChange,
  onAnalyzingChange,
  onAnalysis,
  onPhotoOnly,
  onError,
}: Props) {
  const { t } = useTranslation();
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const photoOnlyRef = useRef<HTMLInputElement>(null);
  const [liveOpen, setLiveOpen] = useState(autoStart === "live");
  const autoStartedRef = useRef(autoStart === "live");

  useEffect(() => {
    onLiveOpenChange?.(liveOpen);
  }, [liveOpen, onLiveOpenChange]);

  useEffect(() => {
    if (!autoStart || autoStartedRef.current || analyzing || preview) return;
    autoStartedRef.current = true;
    if (autoStart === "live") {
      setLiveOpen(true);
      return;
    }
    cameraRef.current?.click();
  }, [autoStart, analyzing, preview]);

  async function analyzeFile(file: File) {
    onAnalyzingChange(true);
    onError("");

    try {
      const dataUrl = await fileToDataUrl(file);
      const analysis = await api.analyzeMeal(dataUrl);
      onAnalysis({ ...analysis, preview: dataUrl });
    } catch (err) {
      onError((err as Error).message);
    } finally {
      onAnalyzingChange(false);
    }
  }

  function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    void analyzeFile(file);
  }

  async function onPhotoOnlyChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    onError("");
    try {
      const dataUrl = await fileToDataUrl(file);
      onPhotoOnly(dataUrl);
    } catch (err) {
      onError((err as Error).message);
    }
  }

  function handleLiveApply(result: MealPhotoAnalysis) {
    setLiveOpen(false);
    onAnalysis(result);
  }

  if (liveOpen) {
    return (
      <MealLiveScanner
        onApply={handleLiveApply}
        onClose={() => setLiveOpen(false)}
      />
    );
  }

  return (
    <div className={`meal-photo-capture${analyzing ? " meal-photo-capture--analyzing" : ""}`}>
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        hidden
        onChange={onFileChange}
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={onFileChange}
      />
      <input
        ref={photoOnlyRef}
        type="file"
        accept="image/*"
        hidden
        onChange={onPhotoOnlyChange}
      />

      <div className="meal-photo-actions">
        <button
          type="button"
          className="btn btn-primary btn-block"
          onClick={() => setLiveOpen(true)}
          disabled={analyzing}
        >
          {t("log.liveCamera")}
        </button>
        <div className="meal-photo-actions-row">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => cameraRef.current?.click()}
            disabled={analyzing}
          >
            {analyzing ? t("log.analyzing") : t("log.takePhoto")}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => galleryRef.current?.click()}
            disabled={analyzing}
          >
            {analyzing ? t("log.analyzing") : t("log.fromGallery")}
          </button>
        </div>
        <button
          type="button"
          className="btn btn-secondary btn-block"
          onClick={() => photoOnlyRef.current?.click()}
          disabled={analyzing}
        >
          {t("log.photoOnly")}
        </button>
      </div>

      {preview && (
        <div className="meal-preview-wrap">
          <img src={preview} alt="" className="meal-preview meal-preview--reveal" />
        </div>
      )}
      {aiNote && <p className="muted small">{aiNote}</p>}
    </div>
  );
}
