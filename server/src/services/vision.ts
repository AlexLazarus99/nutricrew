import { config } from "../config.js";
import { claudeModelsToTry } from "../lib/claudeModels.js";
import { requestClaudeMessage } from "../lib/claudeMessages.js";
import { hashImageBase64 } from "../lib/imageHash.js";
import {
  buildFoodImagePrompt,
  parseApiError,
  parseMealJsonResponse,
  sanitizeBase64,
  splitImageData,
} from "../lib/mealLlmShared.js";
import * as visionCacheRepo from "../repositories/visionCache.js";
import type { AppLocale, MealAnalysis, VisionFallbackReason } from "../types.js";

const GEMINI_MODEL_FALLBACKS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-1.5-flash-8b",
] as const;

type VisionProvider = "claude" | "openai" | "gemini";

type ProviderProbe = { ok: boolean; status?: number; hint?: string };

let lastVisionHints: { claude?: string; openai?: string; gemini?: string } = {};

export function getLastVisionHints() {
  return lastVisionHints;
}

function geminiModelsToTry(): string[] {
  const preferred = config.geminiVisionModel.trim();
  return [...new Set([preferred, ...GEMINI_MODEL_FALLBACKS].filter(Boolean))];
}

function hasVisionKey(): boolean {
  return Boolean(config.anthropicApiKey || config.openaiApiKey || config.geminiApiKey);
}

function estimateCarbsFat(calories: number, protein: number): { carbs: number; fat: number } {
  const proteinKcal = protein * 4;
  const remaining = Math.max(0, calories - proteinKcal);
  return {
    carbs: Math.round((remaining * 0.55) / 4),
    fat: Math.round((remaining * 0.45) / 9),
  };
}

type GeminiResponse = {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  promptFeedback?: { blockReason?: string };
  error?: { message?: string };
};

async function callClaudeVision(
  dataUrl: string,
  locale: AppLocale,
  imageHash: string,
): Promise<MealAnalysis | null> {
  if (!config.anthropicApiKey) return null;

  const { mimeType, base64 } = splitImageData(dataUrl);
  if (!base64 || base64.length < 32) {
    lastVisionHints.claude = "invalid image data";
    return null;
  }

  const mediaType = mimeType.startsWith("image/") ? mimeType : "image/jpeg";
  const errors: string[] = [];

  for (const model of claudeModelsToTry(config.claudeVisionModel)) {
    try {
      const result = await requestClaudeMessage(config.anthropicApiKey, model, [
        {
          type: "image",
          source: { type: "base64", media_type: mediaType, data: base64 },
        },
        { type: "text", text: buildFoodImagePrompt(locale) },
      ]);

      if (!result.ok) {
        errors.push(result.hint);
        if (!result.notFound) break;
        continue;
      }

      lastVisionHints.claude = undefined;
      return parseMealJsonResponse(result.raw, locale, "claude", imageHash);
    } catch (err) {
      errors.push(`${model}: ${(err as Error).message}`);
    }
  }

  lastVisionHints.claude = errors[0] ?? "all models failed";
  console.error("Claude vision failed", errors.join(" | "));
  return null;
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
              { type: "text", text: buildFoodImagePrompt(locale) },
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
      return null;
    }

    lastVisionHints.openai = undefined;
    return parseMealJsonResponse(raw, locale, "openai", imageHash);
  } catch (err) {
    lastVisionHints.openai = (err as Error).message;
    console.error("OpenAI vision parse failed", err);
    return null;
  }
}

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
            { text: buildFoodImagePrompt(locale) },
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
        return parseMealJsonResponse(result.raw, locale, "gemini", imageHash);
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
  if (result.source === "openai" || result.source === "gemini" || result.source === "claude") {
    await visionCacheRepo.setCachedAnalysis(result.imageHash!, locale, result);
  }
  return result;
}

function buildVisionHint(): string | undefined {
  const parts: string[] = [];
  if (lastVisionHints.claude) parts.push(`Claude: ${lastVisionHints.claude}`);
  if (lastVisionHints.openai) parts.push(`OpenAI: ${lastVisionHints.openai}`);
  if (lastVisionHints.gemini) parts.push(`Gemini: ${lastVisionHints.gemini}`);
  return parts.length ? parts.join("; ") : undefined;
}

async function tryVisionProviders(
  dataUrl: string,
  locale: AppLocale,
  imageHash: string,
): Promise<MealAnalysis | null> {
  const chain: Array<() => Promise<MealAnalysis | null>> = [];

  if (config.anthropicApiKey) {
    chain.push(() => callClaudeVision(dataUrl, locale, imageHash));
  }
  if (config.openaiApiKey) {
    chain.push(() => callOpenAIVision(dataUrl, locale, imageHash));
  }
  if (config.geminiApiKey) {
    chain.push(() => callGeminiVision(dataUrl, locale, imageHash));
  }

  for (const attempt of chain) {
    const result = await attempt();
    if (result) return result;
  }

  return null;
}

export async function probeVisionProviders(): Promise<{
  claude: ProviderProbe;
  openai: ProviderProbe;
  gemini: ProviderProbe;
}> {
  const claude: ProviderProbe = { ok: false };
  const openai: ProviderProbe = { ok: false };
  const gemini: ProviderProbe = { ok: false };

  if (config.anthropicApiKey) {
    const probeErrors: string[] = [];
    for (const model of claudeModelsToTry(config.claudeTextModel)) {
      try {
        const result = await requestClaudeMessage(
          config.anthropicApiKey,
          model,
          [{ type: "text", text: "Reply with ok" }],
          8,
        );
        claude.status = result.ok ? 200 : result.status;
        if (result.ok) {
          claude.ok = true;
          claude.hint = `model ${result.model}`;
          break;
        }
        probeErrors.push(result.hint);
        if (!result.notFound) break;
      } catch (err) {
        probeErrors.push((err as Error).message);
        break;
      }
    }
    if (!claude.ok) {
      claude.hint = probeErrors[0] ?? "probe failed";
    }
  } else {
    claude.hint = "not configured";
  }

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

  return { claude, openai, gemini };
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

  if (!hasVisionKey()) {
    return { ...fallbackAnalysis("no_key"), imageHash, cacheHit: false };
  }

  const result = await tryVisionProviders(dataUrl, locale, imageHash);
  if (result) return cacheAndReturn(result, locale);

  const reason: VisionFallbackReason = hasVisionKey() ? "api_error" : "no_key";
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
