import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { api, type MealAnalysisResponse } from "../../api/client";
import { videoFrameToDataUrl } from "../../lib/imageCapture";

const SCAN_INTERVAL_MS = 3500;

type LiveEstimate = MealAnalysisResponse & { preview: string };

type Props = {
  onApply: (estimate: LiveEstimate) => void;
  onClose: () => void;
};

export function MealLiveScanner({ onApply, onClose }: Props) {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanBusyRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [estimate, setEstimate] = useState<LiveEstimate | null>(null);
  const [cameraReady, setCameraReady] = useState(false);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraReady(false);
  }, []);

  const scanFrame = useCallback(async () => {
    const video = videoRef.current;
    if (!video || scanBusyRef.current) return;

    const dataUrl = videoFrameToDataUrl(video);
    if (!dataUrl) return;

    scanBusyRef.current = true;
    setScanning(true);
    setError(null);

    try {
      const analysis = await api.analyzeMeal(dataUrl);
      setEstimate({ ...analysis, preview: dataUrl });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      scanBusyRef.current = false;
      setScanning(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function start() {
      setError(null);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          await video.play();
          setCameraReady(true);
        }
      } catch {
        if (!cancelled) {
          setError(t("log.cameraDenied"));
        }
      }
    }

    void start();
    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [stopCamera, t]);

  useEffect(() => {
    if (!cameraReady) return;

    const id = window.setInterval(() => {
      void scanFrame();
    }, SCAN_INTERVAL_MS);

    void scanFrame();

    return () => window.clearInterval(id);
  }, [cameraReady, scanFrame]);

  function handleClose() {
    stopCamera();
    onClose();
  }

  function handleApply() {
    if (!estimate) return;
    stopCamera();
    onApply(estimate);
  }

  return (
    <div className="meal-live-scanner">
      <div className="meal-live-viewport">
        <video ref={videoRef} className="meal-live-video" playsInline muted autoPlay />
        {scanning && !estimate && (
          <div className="meal-live-overlay meal-live-overlay--scan">
            <span>{t("log.liveScanning")}</span>
          </div>
        )}
        {estimate && (
          <div className="meal-live-overlay meal-live-overlay--result">
            <p className="meal-live-title">{estimate.description}</p>
            {estimate.servingGrams ? (
              <p className="muted small">{t("log.aiPortionNote", { grams: estimate.servingGrams })}</p>
            ) : null}
            <p className="meal-live-kcal">
              {t("log.liveCalories", { kcal: estimate.calories })}
            </p>
            <p className="meal-live-macros">
              {t("log.liveMacros", {
                protein: estimate.protein,
                carbs: estimate.carbs,
                fat: estimate.fat,
              })}
            </p>
            <p className="muted small">
              {t("log.aiNote", {
                confidence: Math.round(estimate.confidence * 100),
                source: estimate.source,
              })}
            </p>
          </div>
        )}
      </div>

      {error && <p className="error-text small">{error}</p>}

      <div className="meal-live-actions">
        <button type="button" className="btn btn-secondary" onClick={() => void scanFrame()} disabled={scanning}>
          {scanning ? t("log.analyzing") : t("log.liveScanNow")}
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleApply}
          disabled={!estimate || scanning}
        >
          {t("log.liveApply")}
        </button>
        <button type="button" className="btn btn-ghost" onClick={handleClose}>
          {t("log.liveClose")}
        </button>
      </div>
    </div>
  );
}
