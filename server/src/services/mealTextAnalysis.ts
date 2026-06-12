import { config } from "../config.js";
import { claudeModelsToTry } from "../lib/claudeModels.js";
import { requestClaudeMessage } from "../lib/claudeMessages.js";
import {
  buildBarcodeAiPrompt,
  buildFoodTextPrompt,
  parseApiError,
  parseMealJsonResponse,
} from "../lib/mealLlmShared.js";
import * as analyticsRepo from "../repositories/analytics.js";
import { isUserPro } from "./userPro.js";
import type { AppLocale, MealAnalysis, VisionFallbackReason } from "../types.js";

const FREE_ANALYZE_LIMIT = 20;
const PRO_ANALYZE_LIMIT = 80;

type TextProvider = "claude" | "openai" | "gemini";

let lastTextHints: { claude?: string; openai?: string; gemini?: string } = {};

export function getLastTextHints() {
  return lastTextHints;
}

export async function assertTextAnalyzeLimit(userId: number): Promise<void> {
  const pro = await isUserPro(userId);
  const limit = pro ? PRO_ANALYZE_LIMIT : FREE_ANALYZE_LIMIT;
  const [imageCount, textCount] = await Promise.all([
    analyticsRepo.countEventsToday(userId, "meal_analyze"),
    analyticsRepo.countEventsToday(userId, "meal_analyze_text"),
  ]);
  if (imageCount + textCount >= limit) {
    throw new Error("ANALYZE_LIMIT");
  }
}

function hasAnyLlmKey(): boolean {
  return Boolean(config.anthropicApiKey || config.openaiApiKey || config.geminiApiKey);
}

function fallbackTextAnalysis(
  reason: VisionFallbackReason,
  visionHint?: string,
  source: MealAnalysis["source"] = "fallback",
): MealAnalysis {
  return {
    description: "Meal (estimate)",
    calories: 450,
    protein: 25,
    carbs: 50,
    fat: 18,
    confidence: 0.35,
    mealType: "unknown",
    source,
    visionReason: reason,
    visionHint,
  };
}

function buildTextHint(): string | undefined {
  const parts: string[] = [];
  if (lastTextHints.claude) parts.push(`Claude: ${lastTextHints.claude}`);
  if (lastTextHints.openai) parts.push(`OpenAI: ${lastTextHints.openai}`);
  if (lastTextHints.gemini) parts.push(`Gemini: ${lastTextHints.gemini}`);
  return parts.length ? parts.join("; ") : undefined;
}

async function callClaudeText(prompt: string): Promise<string | null> {
  if (!config.anthropicApiKey) return null;

  const errors: string[] = [];

  for (const model of claudeModelsToTry(config.claudeTextModel)) {
    try {
      const result = await requestClaudeMessage(
        config.anthropicApiKey,
        model,
        [{ type: "text", text: prompt }],
      );

      if (!result.ok) {
        errors.push(result.hint);
        if (!result.notFound) break;
        continue;
      }

      lastTextHints.claude = undefined;
      return result.raw;
    } catch (err) {
      errors.push(`${model}: ${(err as Error).message}`);
      break;
    }
  }

  lastTextHints.claude = errors[0] ?? "all models failed";
  return null;
}

async function callOpenAIText(prompt: string): Promise<string | null> {
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
        max_tokens: 400,
        response_format: { type: "json_object" },
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      lastTextHints.openai = parseApiError(errText, `HTTP ${res.status}`);
      return null;
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const raw = data.choices?.[0]?.message?.content?.trim() ?? "";
    if (!raw) {
      lastTextHints.openai = "empty response";
      return null;
    }

    lastTextHints.openai = undefined;
    return raw;
  } catch (err) {
    lastTextHints.openai = (err as Error).message;
    return null;
  }
}

async function callGeminiText(prompt: string): Promise<string | null> {
  if (!config.geminiApiKey) return null;

  const model = config.geminiVisionModel || "gemini-2.0-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": config.geminiApiKey,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 512,
          responseMimeType: "application/json",
        },
      }),
    });

    const data = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      error?: { message?: string };
    };

    if (!res.ok) {
      lastTextHints.gemini = parseApiError(JSON.stringify(data), `HTTP ${res.status}`);
      return null;
    }

    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
    if (!raw) {
      lastTextHints.gemini = data.error?.message ?? "empty response";
      return null;
    }

    lastTextHints.gemini = undefined;
    return raw;
  } catch (err) {
    lastTextHints.gemini = (err as Error).message;
    return null;
  }
}

async function runTextLlmChain(
  prompt: string,
  locale: AppLocale,
  outputSource: MealAnalysis["source"],
): Promise<MealAnalysis | null> {
  const providers: Array<{ name: TextProvider; call: () => Promise<string | null> }> = [
    { name: "claude", call: () => callClaudeText(prompt) },
    { name: "openai", call: () => callOpenAIText(prompt) },
    { name: "gemini", call: () => callGeminiText(prompt) },
  ];

  for (const provider of providers) {
    const raw = await provider.call();
    if (!raw) continue;
    try {
      return parseMealJsonResponse(raw, locale, outputSource);
    } catch (err) {
      lastTextHints[provider.name] = `parse ${(err as Error).message}`;
    }
  }

  return null;
}

export async function analyzeMealText(
  text: string,
  locale: AppLocale,
  options?: { source?: "voice" | "claude" },
): Promise<MealAnalysis> {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error("TEXT_REQUIRED");
  }

  if (!hasAnyLlmKey()) {
    return fallbackTextAnalysis("no_key", undefined, options?.source ?? "voice");
  }

  const outputSource = options?.source ?? "voice";
  const prompt = buildFoodTextPrompt(locale, trimmed);
  const result = await runTextLlmChain(prompt, locale, outputSource);

  if (result) return result;

  const reason: VisionFallbackReason = hasAnyLlmKey() ? "api_error" : "no_key";
  return fallbackTextAnalysis(reason, buildTextHint(), outputSource);
}

export async function estimateBarcodeWithAi(
  barcode: string,
  locale: AppLocale,
  hint?: string,
): Promise<MealAnalysis> {
  const code = barcode.replace(/\D/g, "");
  if (code.length < 8) {
    throw new Error("INVALID_BARCODE");
  }

  if (!hasAnyLlmKey()) {
    return fallbackTextAnalysis("no_key", undefined, "barcode_ai");
  }

  const prompt = buildBarcodeAiPrompt(locale, code, hint);
  const result = await runTextLlmChain(prompt, locale, "barcode_ai");

  if (result) return result;

  const reason: VisionFallbackReason = hasAnyLlmKey() ? "api_error" : "no_key";
  return fallbackTextAnalysis(reason, buildTextHint(), "barcode_ai");
}
