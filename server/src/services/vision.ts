import { config } from "../config.js";
import { hashImageBase64 } from "../lib/imageHash.js";
import * as visionCacheRepo from "../repositories/visionCache.js";
import type { AppLocale, MealAnalysis, MealType, VisionFallbackReason } from "../types.js";

const MEAL_TYPES = new Set<MealType>([
  "breakfast",
  "lunch",
  "dinner",
  "snack",
  "drink",
  "unknown",
]);

const GEMINI_MODEL_FALLBACKS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-1.5-flash-8b",
] as const;

type VisionProvider = "openai" | "gemini";

type RawVisionJson = {
  description?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  confidence?: number;
  mealType?: string;
};

type ProviderProbe = { ok: boolean; status?: number; hint?: string };

let lastVisionHints: { openai?: string; gemini?: string } = {};

export function getLastVisionHints() {
  return lastVisionHints;
}

function geminiModelsToTry(): string[] {
  const preferred = config.geminiVisionModel.trim();
  return [...new Set([preferred, ...GEMINI_MODEL_FALLBACKS].filter(Boolean))];
}

function buildFoodPrompt(locale: AppLocale): string {
  const lang = locale === "ru" ? "Russian" : "English";
  const notFood = locale === "ru" ? "Не еда" : "Not food";

  return `You are a nutrition vision assistant for NutriCrew (Telegram miniapp).

Estimate the portion realistically (typical home or café serving, not an ideal nutrition label).

Respond with ONLY valid JSON (no markdown, no extra text):
{"description":"short meal name in ${lang}","calories":number,"protein":number,"carbs":number,"fat":number,"confidence":0.0-1.0,"mealType":"breakfast|lunch|dinner|snack|drink|unknown"}

Rules:
- protein, carbs, fat in grams; calories in kcal.
- If the image is not food or unclear: confidence < 0.3, description "${notFood}", mealType "unknown".
- Multiple dishes: one combined name and total macros.
- Do not set confidence above 0.9 without clear portion cues.
- Include sauces, oil, and drinks in calories.`;
}

function estimateCarbsFat(calories: number, protein: number): { carbs: number; fat: number } {
  const proteinKcal = protein * 4;
  const remaining = Math.max(0, calories - proteinKcal);
  return {
    carbs: Math.round((remaining * 0.55) / 4),
    fat: Math.round((remaining * 0.45) / 9),
  };
}

function parseMealType(value: unknown): MealType | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.toLowerCase().trim() as MealType;
  return MEAL_TYPES.has(normalized) ? normalized : undefined;
}

function extractJsonObject(raw: string): string {
  const trimmed = raw.trim().replace(/^```json?\s*|\s*```$/g, "");
  if (trimmed.startsWith("{")) return trimmed;

  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) {
    return trimmed.slice(start, end + 1);
  }
  return trimmed;
}

function sanitizeBase64(data: string): string {
  return data.replace(/\s+/g, "");
}

function splitImageData(dataUrl: string): { mimeType: string; base64: string } {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/s);
  if (match) {
    return { mimeType: match[1]!, base64: sanitizeBase64(match[2]!) };
  }
  return {
    mimeType: "image/jpeg",
    base64: sanitizeBase64(dataUrl.replace(/^data:image\/\w+;base64,/, "")),
  };
}

function parseApiError(body: string, fallback: string): string {
  try {
    const json = JSON.parse(body) as {
      error?: { message?: string; status?: string };
      message?: string;
    };
    return json.error?.message ?? json.message ?? fallback;
  } catch {
    return body.slice(0, 180) || fallback;
  }
}

function buildMealAnalysis(
  json: RawVisionJson,
  locale: AppLocale,
  source: VisionProvider,
  imageHash: string,
): MealAnalysis {
  const calories = Math.round(Number(json.calories) || 400);
  const protein = Math.round(Number(json.protein) || 20);
  const estimated = estimateCarbsFat(calories, protein);
  let confidence = Math.min(1, Math.max(0, Number(json.confidence) || 0.7));
  const mealType = parseMealType(json.mealType);

  const notFood =
    locale === "ru"
      ? json.description?.toLowerCase().includes("не еда")
      : json.description?.toLowerCase().includes("not food");
  if (notFood || (mealType === "unknown" && confidence < 0.3)) {
    confidence = Math.min(confidence, 0.29);
  }

  return {
    description: json.description ?? (locale === "ru" ? "Блюдо" : "Meal"),
    calories,
    protein,
    carbs: Math.round(Number(json.carbs) || estimated.carbs),
    fat: Math.round(Number(json.fat) || estimated.fat),
    confidence,
    mealType,
    source,
    imageHash,
    cacheHit: false,
  };
}

function parseVisionResponse(raw: string, locale: AppLocale, source: VisionProvider, imageHash: string) {
  const json = JSON.parse(extractJsonObject(raw)) as RawVisionJson;
  return buildMealAnalysis(json, locale, source, imageHash);
}

async function callOpenAIVision(
  dataUrl: string,
  locale: AppLocale,
  imageHash: string,
): Promise<MealAnalysis | null> {
  if (!config.openaiApiKey) return null;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: config.visionModel,
        max_tokens: 350,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: buildFoodPrompt(locale) },
              {
                type: "image_url",
                image_url: { url: dataUrl, detail: "low" },
              },
            ],
          },
        ],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      lastVisionHints.openai = parseApiError(errText, `HTTP ${res.status}`);
      console.error("OpenAI vision error", res.status, errText.slice(0, 500));
      return null;
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const raw = data.choices?.[0]?.message?.content?.trim() ?? "";
    if (!raw) {
      lastVisionHints.openai = "empty response";
      console.error("OpenAI vision empty response");
      return null;
    }

    lastVisionHints.openai = undefined;
    return parseVisionResponse(raw, locale, "openai", imageHash);
  } catch (err) {
    lastVisionHints.openai = (err as Error).message;
    console.error("OpenAI vision parse failed", err);
    return null;
  }
}

type GeminiResponse = {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  promptFeedback?: { blockReason?: string };
  error?: { message?: string };
};

async function requestGeminiVision(
  model: string,
  mimeType: string,
  base64: string,
  locale: AppLocale,
  jsonMode: boolean,
): Promise<{ ok: true; raw: string } | { ok: false; status: number; hint: string }> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;

  const generationConfig: Record<string, unknown> = {
    temperature: 0.2,
    maxOutputTokens: 512,
  };
  if (jsonMode) {
    generationConfig.responseMimeType = "application/json";
  }

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
            { inline_data: { mime_type: mimeType, data: base64 } },
            { text: buildFoodPrompt(locale) },
          ],
        },
      ],
      generationConfig,
    }),
  });

  const data = (await res.json()) as GeminiResponse;

  if (!res.ok) {
    const hint = parseApiError(JSON.stringify(data), `HTTP ${res.status}`);
    return { ok: false, status: res.status, hint };
  }

  if (data.error?.message) {
    return { ok: false, status: res.status, hint: data.error.message };
  }

  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
  if (!raw) {
    const block = data.promptFeedback?.blockReason;
    return {
      ok: false,
      status: res.status,
      hint: block ? `blocked: ${block}` : "empty response",
    };
  }

  return { ok: true, raw };
}

async function callGeminiVision(
  dataUrl: string,
  locale: AppLocale,
  imageHash: string,
): Promise<MealAnalysis | null> {
  if (!config.geminiApiKey) return null;

  const { mimeType, base64 } = splitImageData(dataUrl);
  if (!base64 || base64.length < 32) {
    lastVisionHints.gemini = "invalid image data";
    return null;
  }

  const errors: string[] = [];

  for (const model of geminiModelsToTry()) {
    for (const jsonMode of [true, false] as const) {
      const result = await requestGeminiVision(model, mimeType, base64, locale, jsonMode);
      if (!result.ok) {
        errors.push(`${model}${jsonMode ? "+json" : ""}: ${result.hint}`);
        continue;
      }

      try {
        lastVisionHints.gemini = undefined;
        return parseVisionResponse(result.raw, locale, "gemini", imageHash);
      } catch (err) {
        errors.push(`${model}: parse ${(err as Error).message}`);
      }
    }
  }

  lastVisionHints.gemini = errors[0] ?? "all models failed";
  console.error("Gemini vision failed", errors.join(" | "));
  return null;
}

async function cacheAndReturn(
  result: MealAnalysis,
  locale: AppLocale,
): Promise<MealAnalysis> {
  if (result.source === "openai" || result.source === "gemini") {
    await visionCacheRepo.setCachedAnalysis(result.imageHash!, locale, result);
  }
  return result;
}

function buildVisionHint(): string | undefined {
  const parts: string[] = [];
  if (lastVisionHints.openai) parts.push(`OpenAI: ${lastVisionHints.openai}`);
  if (lastVisionHints.gemini) parts.push(`Gemini: ${lastVisionHints.gemini}`);
  return parts.length ? parts.join("; ") : undefined;
}

export async function probeVisionProviders(): Promise<{
  openai: ProviderProbe;
  gemini: ProviderProbe;
}> {
  const openai: ProviderProbe = { ok: false };
  const gemini: ProviderProbe = { ok: false };

  if (config.openaiApiKey) {
    try {
      const res = await fetch("https://api.openai.com/v1/models", {
        headers: { Authorization: `Bearer ${config.openaiApiKey}` },
      });
      openai.status = res.status;
      openai.ok = res.ok;
      if (!res.ok) {
        openai.hint = parseApiError(await res.text(), `HTTP ${res.status}`);
      }
    } catch (err) {
      openai.hint = (err as Error).message;
    }
  } else {
    openai.hint = "not configured";
  }

  if (config.geminiApiKey) {
    const model = geminiModelsToTry()[0] ?? "gemini-1.5-flash";
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": config.geminiApiKey,
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: "Reply with ok" }] }],
            generationConfig: { maxOutputTokens: 8 },
          }),
        },
      );
      gemini.status = res.status;
      const data = (await res.json()) as GeminiResponse;
      gemini.ok = res.ok && Boolean(data.candidates?.[0]?.content?.parts?.[0]?.text);
      if (!gemini.ok) {
        gemini.hint = parseApiError(JSON.stringify(data), `HTTP ${res.status}`);
      }
    } catch (err) {
      gemini.hint = (err as Error).message;
    }
  } else {
    gemini.hint = "not configured";
  }

  return { openai, gemini };
}

export async function analyzeFoodImage(
  base64Image: string,
  locale: AppLocale = "en",
): Promise<MealAnalysis> {
  const imageHash = hashImageBase64(base64Image);
  const cached = await visionCacheRepo.getCachedAnalysis(imageHash, locale);
  if (cached) {
    return { ...cached, imageHash, cacheHit: true };
  }

  const dataUrl = base64Image.startsWith("data:")
    ? base64Image
    : `data:image/jpeg;base64,${sanitizeBase64(base64Image)}`;

  if (!config.openaiApiKey && !config.geminiApiKey) {
    return { ...fallbackAnalysis("no_key"), imageHash, cacheHit: false };
  }

  let geminiTried = false;

  if (config.geminiApiKey && !config.openaiApiKey) {
    geminiTried = true;
    const gemini = await callGeminiVision(dataUrl, locale, imageHash);
    if (gemini) return cacheAndReturn(gemini, locale);
  }

  if (config.openaiApiKey) {
    const openai = await callOpenAIVision(dataUrl, locale, imageHash);
    if (openai) return cacheAndReturn(openai, locale);
    console.warn("OpenAI vision failed — trying Gemini fallback");
  }

  if (config.geminiApiKey && !geminiTried) {
    const gemini = await callGeminiVision(dataUrl, locale, imageHash);
    if (gemini) return cacheAndReturn(gemini, locale);
  }

  const reason: VisionFallbackReason =
    config.openaiApiKey || config.geminiApiKey ? "api_error" : "no_key";
  const hint = buildVisionHint();
  return { ...fallbackAnalysis(reason, hint), imageHash, cacheHit: false };
}

function fallbackAnalysis(reason: VisionFallbackReason, visionHint?: string): MealAnalysis {
  const calories = 450;
  const protein = 25;
  const { carbs, fat } = estimateCarbsFat(calories, protein);
  return {
    description: "Meal (estimate)",
    calories,
    protein,
    carbs,
    fat,
    confidence: 0.4,
    mealType: "unknown",
    source: "fallback",
    visionReason: reason,
    visionHint,
  };
}
