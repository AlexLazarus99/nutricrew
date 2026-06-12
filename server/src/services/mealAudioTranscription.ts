import { config } from "../config.js";
import { parseApiError } from "../lib/mealLlmShared.js";
import type { AppLocale } from "../types.js";

let lastTranscribeHint: string | undefined;

export function getLastTranscribeHint() {
  return lastTranscribeHint;
}

function sanitizeBase64(data: string): string {
  return data.replace(/\s+/g, "").replace(/^data:[^;]+;base64,/, "");
}

async function transcribeWithOpenAI(
  buffer: Buffer,
  mimeType: string,
  locale: AppLocale,
): Promise<string | null> {
  if (!config.openaiApiKey) return null;

  const ext = mimeType.includes("mp4") ? "m4a" : mimeType.includes("ogg") ? "ogg" : "webm";
  const blob = new Blob([new Uint8Array(buffer)], { type: mimeType || "audio/webm" });
  const form = new FormData();
  form.append("file", blob, `voice.${ext}`);
  form.append("model", config.whisperModel);
  form.append("response_format", "text");
  if (locale === "ru") form.append("language", "ru");

  try {
    const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${config.openaiApiKey}` },
      body: form,
    });

    if (!res.ok) {
      lastTranscribeHint = `Whisper: ${parseApiError(await res.text(), `HTTP ${res.status}`)}`;
      return null;
    }

    const text = (await res.text()).trim();
    if (!text) {
      lastTranscribeHint = "Whisper: empty transcript";
      return null;
    }

    lastTranscribeHint = undefined;
    return text;
  } catch (err) {
    lastTranscribeHint = `Whisper: ${(err as Error).message}`;
    return null;
  }
}

async function transcribeWithGemini(
  buffer: Buffer,
  mimeType: string,
  locale: AppLocale,
): Promise<string | null> {
  if (!config.geminiApiKey) return null;

  const model = config.geminiVisionModel || "gemini-2.0-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
  const lang = locale === "ru" ? "Russian" : "English";

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": config.geminiApiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                inline_data: {
                  mime_type: mimeType || "audio/webm",
                  data: buffer.toString("base64"),
                },
              },
              {
                text: `Transcribe the spoken meal description in ${lang}. Return only the transcription text, no JSON.`,
              },
            ],
          },
        ],
        generationConfig: { temperature: 0.1, maxOutputTokens: 256 },
      }),
    });

    const data = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      error?: { message?: string };
    };

    if (!res.ok) {
      lastTranscribeHint = `Gemini: ${parseApiError(JSON.stringify(data), `HTTP ${res.status}`)}`;
      return null;
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
    if (!text) {
      lastTranscribeHint = data.error?.message ?? "Gemini: empty transcript";
      return null;
    }

    lastTranscribeHint = undefined;
    return text;
  } catch (err) {
    lastTranscribeHint = `Gemini: ${(err as Error).message}`;
    return null;
  }
}

export async function transcribeMealAudio(
  audioBase64: string,
  locale: AppLocale,
  mimeType = "audio/webm",
): Promise<string> {
  const base64 = sanitizeBase64(audioBase64);
  if (!base64 || base64.length < 32) {
    throw new Error("INVALID_AUDIO");
  }

  const buffer = Buffer.from(base64, "base64");
  if (buffer.length < 400) {
    throw new Error("AUDIO_TOO_SHORT");
  }

  const openai = await transcribeWithOpenAI(buffer, mimeType, locale);
  if (openai) return openai;

  const gemini = await transcribeWithGemini(buffer, mimeType, locale);
  if (gemini) return gemini;

  if (!config.openaiApiKey && !config.geminiApiKey) {
    throw new Error("TRANSCRIBE_NO_KEY");
  }

  throw new Error("TRANSCRIBE_FAILED");
}
