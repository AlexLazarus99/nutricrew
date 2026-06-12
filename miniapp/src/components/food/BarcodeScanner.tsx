import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { BrowserMultiFormatReader } from "@zxing/browser";
import type { IScannerControls } from "@zxing/browser";
import { api } from "../../api/client";
import { lookupBarcode } from "../../lib/barcodeLookup";
import { macrosFromPer100g } from "../../lib/foodPortion";
import type { MealAnalysisResponse } from "../../api/client";

export type BarcodeMealResult = MealAnalysisResponse & {
  barcode: string;
  servingGrams: number;
  barcodeDataSource?: "ru_catalog" | "off_ru" | "off_world";
};

type Props = {
  onApply: (result: BarcodeMealResult) => void;
  onClose: () => void;
};

export function BarcodeScanner({ onApply, onClose }: Props) {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const scannerControlsRef = useRef<IScannerControls | null>(null);
  const scanLockRef = useRef(false);

  const [cameraReady, setCameraReady] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [grams, setGrams] = useState("100");
  const [product, setProduct] = useState<BarcodeMealResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notFoundCode, setNotFoundCode] = useState<string | null>(null);
  const [aiHint, setAiHint] = useState("");
  const [aiBusy, setAiBusy] = useState(false);

  const stopCamera = useCallback(() => {
    scannerControlsRef.current?.stop();
    scannerControlsRef.current = null;
    BrowserMultiFormatReader.releaseAllStreams();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraReady(false);
  }, []);

  const buildResult = useCallback(
    (
      per100: Awaited<ReturnType<typeof lookupBarcode>>,
      portionGrams: number,
    ): BarcodeMealResult | null => {
      if (!per100) return null;
      const macros = macrosFromPer100g(
        per100.brand ? `${per100.name} (${per100.brand})` : per100.name,
        per100,
        portionGrams,
      );
      return {
        ...macros,
        confidence: 0.92,
        mealType: "snack",
        source: "barcode",
        barcode: per100.barcode,
        servingGrams: portionGrams,
        barcodeDataSource: per100.source,
      };
    },
    [],
  );

  const lookupCode = useCallback(
    async (code: string, portion?: number) => {
      setScanning(true);
      setError(null);
      try {
        const per100 = await lookupBarcode(code);
        if (!per100) {
          setNotFoundCode(code);
          setError(t("log.barcodeNotFound"));
          setProduct(null);
          return;
        }
        setNotFoundCode(null);
        const portionGrams = portion ?? per100.servingGrams;
        setGrams(String(portionGrams));
        setManualCode(per100.barcode);
        setProduct(buildResult(per100, portionGrams));
      } catch {
        setError(t("log.barcodeLookupError"));
        setProduct(null);
      } finally {
        setScanning(false);
      }
    },
    [buildResult, t],
  );

  const handleDetected = useCallback(
    (code: string) => {
      if (scanLockRef.current) return;
      scanLockRef.current = true;
      void lookupCode(code).finally(() => {
        window.setTimeout(() => {
          scanLockRef.current = false;
        }, 2500);
      });
    },
    [lookupCode],
  );

  useEffect(() => {
    let cancelled = false;

    async function start() {
      setError(null);
      try {
        const reader = new BrowserMultiFormatReader();
        readerRef.current = reader;
        const controls = await reader.decodeFromVideoDevice(
          undefined,
          videoRef.current ?? undefined,
          (result) => {
            if (result) {
              handleDetected(result.getText());
            }
          },
        );
        if (cancelled) {
          controls.stop();
          return;
        }
        scannerControlsRef.current = controls;
        const video = videoRef.current;
        if (video?.srcObject instanceof MediaStream) {
          streamRef.current = video.srcObject;
        }
        setCameraReady(true);
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
  }, [handleDetected, stopCamera, t]);

  function handleManualLookup() {
    void lookupCode(manualCode, Number(grams) || 100);
  }

  function handleGramsChange(value: string) {
    setGrams(value);
    if (!product) return;
    const g = Number(value) || 100;
    const per100 = {
      calories: Math.round((product.calories / product.servingGrams) * 100),
      protein: Math.round((product.protein / product.servingGrams) * 100),
      carbs: Math.round((product.carbs / product.servingGrams) * 100),
      fat: Math.round((product.fat / product.servingGrams) * 100),
    };
    const macros = macrosFromPer100g(
      product.description.replace(new RegExp(String.raw`\s*\(\d+\s*g\)$`), ""),
      per100,
      g,
    );
    setProduct({
      ...product,
      ...macros,
      servingGrams: g,
    });
  }

  function handleApply() {
    if (!product) return;
    stopCamera();
    onApply(product);
  }

  function handleClose() {
    stopCamera();
    onClose();
  }

  async function handleAiEstimate() {
    const code = (notFoundCode ?? manualCode).replace(/\D/g, "");
    if (code.length < 8) return;

    setAiBusy(true);
    setError(null);
    try {
      const analysis = await api.estimateBarcodeAi(code, aiHint.trim() || undefined);
      const portionGrams = analysis.servingGrams ?? (Number(grams) || 100);
      setGrams(String(portionGrams));
      const result: BarcodeMealResult = {
        ...analysis,
        source: "barcode_ai",
        barcode: code,
        servingGrams: portionGrams,
      };
      setProduct(result);
      setManualCode(code);
      setNotFoundCode(null);
    } catch (err) {
      const msg = (err as Error).message;
      setError(msg === "ANALYZE_LIMIT" ? t("log.error_ANALYZE_LIMIT") : t("log.barcodeAiError"));
    } finally {
      setAiBusy(false);
    }
  }

  return (
    <div className="meal-barcode-scanner">
      <div className="meal-live-viewport">
        <video ref={videoRef} className="meal-live-video" playsInline muted autoPlay />
        <div className="meal-barcode-frame" aria-hidden />
        {scanning && (
          <div className="meal-live-overlay meal-live-overlay--scan">
            <span>{t("log.barcodeScanning")}</span>
          </div>
        )}
        {product && !scanning && (
          <div className="meal-live-overlay meal-live-overlay--result">
            <p className="meal-live-title">{product.description}</p>
            <p className="meal-live-kcal">{t("log.liveCalories", { kcal: product.calories })}</p>
            <p className="meal-live-macros">
              {t("log.liveMacros", {
                protein: product.protein,
                carbs: product.carbs,
                fat: product.fat,
              })}
            </p>
          </div>
        )}
      </div>

      {error && <p className="error-text small">{error}</p>}

      {notFoundCode && (
        <div className="meal-barcode-ai">
          <p className="muted small">{t("log.barcodeAiHint")}</p>
          <label>
            {t("log.barcodeAiProductHint")}
            <input
              value={aiHint}
              onChange={(e) => setAiHint(e.target.value)}
              placeholder={t("log.barcodeAiProductPlaceholder")}
            />
          </label>
          <button
            type="button"
            className="btn btn-secondary btn-block"
            onClick={() => void handleAiEstimate()}
            disabled={aiBusy}
          >
            {aiBusy ? t("log.analyzing") : t("log.barcodeAiEstimate")}
          </button>
        </div>
      )}

      {!cameraReady && !error && (
        <p className="muted small">{t("log.barcodeManualHint")}</p>
      )}

      <div className="meal-barcode-manual">
        <label>
          {t("log.barcodeManual")}
          <input
            inputMode="numeric"
            pattern="[0-9]*"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value.replace(/\D/g, ""))}
            placeholder="4607034471512"
          />
        </label>
        <label>
          {t("log.portionGrams")}
          <input
            type="number"
            min={1}
            max={2000}
            value={grams}
            onChange={(e) => handleGramsChange(e.target.value)}
          />
        </label>
        <button
          type="button"
          className="btn btn-secondary btn-block"
          onClick={handleManualLookup}
          disabled={scanning || manualCode.length < 8}
        >
          {scanning ? t("log.analyzing") : t("log.barcodeLookup")}
        </button>
      </div>

      <div className="meal-live-actions">
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleApply}
          disabled={!product || scanning}
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
