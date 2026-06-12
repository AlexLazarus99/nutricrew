import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { api, type MealAnalysisResponse } from "../../api/client";

type Props = {
  onApply: (result: MealAnalysisResponse) => void;
  onError: (message: string) => void;
};

type SpeechRecognitionCtor = new () => {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: { results: { [index: number]: { [index: number]: { transcript: string } } } }) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
};

function getSpeechRecognition(): SpeechRecognitionCtor | null {
  const w = window as Window & {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function VoiceMealLog({ onApply, onError }: Props) {
  const { t, i18n } = useTranslation();
  const recognitionRef = useRef<InstanceType<SpeechRecognitionCtor> | null>(null);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [manualText, setManualText] = useState("");
  const [analyzing, setAnalyzing] = useState(false);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setListening(false);
  }, []);

  useEffect(() => () => stopListening(), [stopListening]);

  const analyzeText = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      setAnalyzing(true);
      onError("");
      try {
        const analysis = await api.analyzeMealText(trimmed);
        onApply(analysis);
      } catch (err) {
        const msg = (err as Error).message;
        onError(msg === "ANALYZE_LIMIT" ? t("log.error_ANALYZE_LIMIT") : msg);
      } finally {
        setAnalyzing(false);
      }
    },
    [onApply, onError, t],
  );

  function startListening() {
    const SpeechRecognition = getSpeechRecognition();
    if (!SpeechRecognition) {
      onError(t("log.voiceUnsupported"));
      return;
    }

    stopListening();
    const recognition = new SpeechRecognition();
    recognition.lang = i18n.language.startsWith("ru") ? "ru-RU" : "en-US";
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onresult = (event) => {
      const text = event.results[0]?.[0]?.transcript ?? "";
      setTranscript(text);
      setManualText(text);
      void analyzeText(text);
    };

    recognition.onerror = () => {
      setListening(false);
      onError(t("log.voiceError"));
    };

    recognition.onend = () => {
      setListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
    setTranscript("");
    onError("");
  }

  return (
    <div className="voice-meal-log">
      <p className="muted small">{t("log.voiceHint")}</p>

      <button
        type="button"
        className={`btn btn-secondary btn-block voice-meal-log__mic ${listening ? "voice-meal-log__mic--active" : ""}`}
        onClick={listening ? stopListening : startListening}
        disabled={analyzing}
      >
        {analyzing
          ? t("log.analyzing")
          : listening
            ? t("log.voiceListening")
            : t("log.voiceStart")}
      </button>

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
        />
      </label>

      <button
        type="button"
        className="btn btn-primary btn-block"
        disabled={analyzing || !manualText.trim()}
        onClick={() => void analyzeText(manualText)}
      >
        {analyzing ? t("log.analyzing") : t("log.voiceAnalyze")}
      </button>
    </div>
  );
}
