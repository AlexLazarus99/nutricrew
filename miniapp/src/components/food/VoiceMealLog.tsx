import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { api, type MealAnalysisResponse } from "../../api/client";

type Props = {
  onApply: (result: MealAnalysisResponse) => void;
};

type RecordPhase = "idle" | "recording" | "processing";

function pickRecorderMimeType(): string {
  if (typeof MediaRecorder === "undefined") return "";
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
    "audio/ogg",
  ];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) ?? "";
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error ?? new Error("read failed"));
    reader.readAsDataURL(blob);
  });
}

export function VoiceMealLog({ onApply }: Props) {
  const { t } = useTranslation();
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const mimeTypeRef = useRef("audio/webm");

  const [phase, setPhase] = useState<RecordPhase>("idle");
  const [transcript, setTranscript] = useState("");
  const [manualText, setManualText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recorderReady =
    typeof navigator !== "undefined" &&
    Boolean(navigator.mediaDevices?.getUserMedia) &&
    typeof MediaRecorder !== "undefined";

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    recorderRef.current = null;
  }, []);

  useEffect(() => () => stopStream(), [stopStream]);

  const mapVoiceError = useCallback(
    (code: string) => {
      switch (code) {
        case "ANALYZE_LIMIT":
          return t("log.error_ANALYZE_LIMIT");
        case "TRANSCRIBE_NO_KEY":
          return t("log.voiceTranscribeNoKey");
        case "TRANSCRIBE_FAILED":
          return t("log.voiceTranscribeFailed");
        case "AUDIO_TOO_SHORT":
          return t("log.voiceAudioTooShort");
        case "INVALID_AUDIO":
        case "AUDIO_REQUIRED":
          return t("log.voiceError");
        default:
          return code;
      }
    },
    [t],
  );

  const analyzeText = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      setPhase("processing");
      setError(null);
      try {
        const analysis = await api.analyzeMealText(trimmed);
        onApply(analysis);
      } catch (err) {
        setError(mapVoiceError((err as Error).message));
      } finally {
        setPhase("idle");
      }
    },
    [mapVoiceError, onApply],
  );

  const sendAudio = useCallback(
    async (blob: Blob, mimeType: string) => {
      setPhase("processing");
      setError(null);
      try {
        const dataUrl = await blobToDataUrl(blob);
        const result = await api.analyzeMealAudio(dataUrl, mimeType);
        if (result.transcript) {
          setTranscript(result.transcript);
          setManualText(result.transcript);
        }
        onApply(result);
      } catch (err) {
        setError(mapVoiceError((err as Error).message));
      } finally {
        setPhase("idle");
        stopStream();
      }
    },
    [mapVoiceError, onApply, stopStream],
  );

  async function startRecording() {
    if (!recorderReady) {
      setError(t("log.voiceUnsupported"));
      return;
    }

    setError(null);
    setTranscript("");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      streamRef.current = stream;

      const mimeType = pickRecorderMimeType();
      mimeTypeRef.current = mimeType || "audio/webm";
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: mimeTypeRef.current || recorder.mimeType || "audio/webm",
        });
        chunksRef.current = [];
        if (blob.size < 400) {
          setPhase("idle");
          setError(t("log.voiceAudioTooShort"));
          stopStream();
          return;
        }
        void sendAudio(blob, blob.type || mimeTypeRef.current);
      };
      recorder.onerror = () => {
        setPhase("idle");
        setError(t("log.voiceError"));
        stopStream();
      };

      recorderRef.current = recorder;
      recorder.start();
      setPhase("recording");
    } catch {
      setPhase("idle");
      setError(t("log.voiceMicDenied"));
      stopStream();
    }
  }

  function stopRecording() {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") {
      setPhase("idle");
      stopStream();
      return;
    }
    recorder.stop();
  }

  const busy = phase === "processing";

  return (
    <div className="voice-meal-log">
      <p className="muted small">{t("log.voiceHint")}</p>

      {error && <p className="error-text small voice-meal-log__error">{error}</p>}

      <button
        type="button"
        className={`btn btn-secondary btn-block voice-meal-log__mic ${
          phase === "recording" ? "voice-meal-log__mic--active" : ""
        }`}
        onClick={() => {
          if (busy) return;
          if (phase === "recording") stopRecording();
          else void startRecording();
        }}
        disabled={busy}
      >
        {busy
          ? t("log.voiceTranscribing")
          : phase === "recording"
            ? t("log.voiceRecordStop")
            : t("log.voiceStart")}
      </button>

      {phase === "recording" && (
        <p className="voice-meal-log__recording small">{t("log.voiceRecording")}</p>
      )}

      {transcript && (
        <p className="voice-meal-log__transcript small">
          {t("log.voiceHeard")}: <strong>{transcript}</strong>
        </p>
      )}

      <label className="voice-meal-log__manual">
        {t("log.voiceManual")}
        <textarea
          rows={2}
          value={manualText}
          onChange={(e) => setManualText(e.target.value)}
          placeholder={t("log.voicePrompt")}
          disabled={busy}
        />
      </label>

      <button
        type="button"
        className="btn btn-primary btn-block"
        disabled={busy || !manualText.trim()}
        onClick={() => void analyzeText(manualText)}
      >
        {busy ? t("log.analyzing") : t("log.voiceAnalyze")}
      </button>
    </div>
  );
}
