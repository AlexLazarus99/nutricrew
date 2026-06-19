import type { AppLocale, MealAnalysis, MealType } from "../types.js";
import { llmLanguageName } from "./locales.js";

export const MEAL_TYPES = new Set<MealType>([
  "breakfast",
  "lunch",
  "dinner",
  "snack",
  "drink",
  "unknown",
]);

export type LlmMealSource =
  | "claude"
  | "openai"
  | "gemini"
  | "fallback"
  | "voice"
  | "barcode_ai";

export type RawMealJson = {
  description?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  servingGrams?: number;
  grams?: number;
  portionGrams?: number;
  weightGrams?: number;
  confidence?: number;
  mealType?: string;
};

const MIN_PORTION_GRAMS = 15;
const MAX_PORTION_GRAMS = 3000;

export function parseServingGramsFromJson(json: RawMealJson): number | undefined {
  const candidate = json.servingGrams ?? json.grams ?? json.portionGrams ?? json.weightGrams;
  const grams = Math.round(Number(candidate));
  if (!Number.isFinite(grams) || grams < MIN_PORTION_GRAMS || grams > MAX_PORTION_GRAMS) {
    return undefined;
  }
  return grams;
}

export function descriptionWithPortion(description: string, grams?: number): string {
  const base = description.replace(/\s*\(\d+(?:[.,]\d+)?\s*g\)\s*$/i, "").trim();
  if (!grams) return base || description;
  return `${base || description} (${grams} g)`;
}

export function buildFoodImagePrompt(locale: AppLocale): string {
  const lang = llmLanguageName(locale);
  const notFood = locale === "ru" ? "Не еда" : "Not food";

  return `You are a nutrition vision assistant for NutriCrew (Telegram miniapp).

Estimate the visible portion weight and total nutrition for everything on the plate/in the photo.

Respond with ONLY valid JSON (no markdown, no extra text):
{"description":"short meal name in ${lang}","servingGrams":number,"calories":number,"protein":number,"carbs":number,"fat":number,"confidence":0.0-1.0,"mealType":"breakfast|lunch|dinner|snack|drink|unknown"}

Rules:
- servingGrams: your best estimate of TOTAL food weight in grams (all items combined).
- Use visual cues: plate/bowl size (~24–26 cm dinner plate), utensils, hand, packaging, cup volume.
- calories, protein, carbs, fat are TOTALS for servingGrams — NOT per 100 g.
- Typical ranges: snack 80–180 g, main dish 250–450 g, drink 200–400 ml as grams.
- If the image is not food or unclear: confidence < 0.3, description "${notFood}", mealType "unknown", servingGrams 0.
- Multiple dishes: one combined name, one servingGrams total, summed macros.
- Do not set confidence above 0.9 without clear portion cues.
- Include sauces, oil, bread, and drinks in servingGrams and calories.`;
}

export function buildFoodTextPrompt(locale: AppLocale, text: string): string {
  const lang = llmLanguageName(locale);

  return `You are a nutrition assistant for NutriCrew (Telegram miniapp).

The user described what they ate (voice or text). Estimate portion weight and total nutrition.

User input: """${text}"""

Respond with ONLY valid JSON:
{"description":"short meal name in ${lang}","servingGrams":number,"calories":number,"protein":number,"carbs":number,"fat":number,"confidence":0.0-1.0,"mealType":"breakfast|lunch|dinner|snack|drink|unknown"}

Rules:
- servingGrams: total portion weight in grams. If user gave weight (g, kg, ml, pieces) — use it; else estimate a realistic single serving.
- calories, protein, carbs, fat are TOTALS for servingGrams — NOT per 100 g.
- If not food or too vague: confidence < 0.35, mealType "unknown".
- Combine multiple items into one servingGrams total and summed macros.
- Typical home/café portions, not nutrition-label per-100g values.`;
}

export function buildBarcodeAiPrompt(
  locale: AppLocale,
  barcode: string,
  hint?: string,
): string {
  const lang = llmLanguageName(locale);
  const hintLine = hint?.trim()
    ? `User hint about the product: """${hint.trim()}"""`
    : "No product name hint was provided.";

  return `You are a nutrition assistant for NutriCrew (Telegram miniapp).

A barcode was scanned but not found in product databases.
Barcode: ${barcode}
${hintLine}

Estimate the most likely packaged food for this barcode region (Russia/CIS if EAN starts with 46) and a typical eaten portion.

Respond with ONLY valid JSON:
{"description":"product name in ${lang}","servingGrams":number,"calories":number,"protein":number,"carbs":number,"fat":number,"confidence":0.0-1.0,"mealType":"snack|unknown"}

Rules:
- servingGrams: typical package serving from label (e.g. 30, 50, 100, 125, 200 g) — not always 100 g.
- calories, protein, carbs, fat are TOTALS for servingGrams — NOT per 100 g.
- confidence 0.35–0.65 unless hint is very specific.
- If impossible to guess: confidence < 0.3, description "${locale === "ru" ? "Неизвестный продукт" : "Unknown product"}".`;
}

export function estimateCarbsFat(calories: number, protein: number): { carbs: number; fat: number } {
  const proteinKcal = protein * 4;
  const remaining = Math.max(0, calories - proteinKcal);
  return {
    carbs: Math.round((remaining * 0.55) / 4),
    fat: Math.round((remaining * 0.45) / 9),
  };
}

export function parseMealType(value: unknown): MealType | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.toLowerCase().trim() as MealType;
  return MEAL_TYPES.has(normalized) ? normalized : undefined;
}

export function extractJsonObject(raw: string): string {
  const trimmed = raw.trim().replace(/^```json?\s*|\s*```$/g, "");
  if (trimmed.startsWith("{")) return trimmed;

  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) {
    return trimmed.slice(start, end + 1);
  }
  return trimmed;
}

export function parseApiError(body: string, fallback: string): string {
  try {
    const json = JSON.parse(body) as {
      error?: { message?: string; status?: string; type?: string };
      message?: string;
    };
    return json.error?.message ?? json.message ?? fallback;
  } catch {
    return body.slice(0, 180) || fallback;
  }
}

export function sanitizeBase64(data: string): string {
  return data.replace(/\s+/g, "");
}

export function splitImageData(dataUrl: string): { mimeType: string; base64: string } {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/s);
  if (match) {
    return { mimeType: match[1]!, base64: sanitizeBase64(match[2]!) };
  }
  return {
    mimeType: "image/jpeg",
    base64: sanitizeBase64(dataUrl.replace(/^data:image\/\w+;base64,/, "")),
  };
}

export function buildMealAnalysis(
  json: RawMealJson,
  locale: AppLocale,
  source: MealAnalysis["source"],
  imageHash?: string,
): MealAnalysis {
  const calories = Math.round(Number(json.calories) || 400);
  const protein = Math.round(Number(json.protein) || 20);
  const estimated = estimateCarbsFat(calories, protein);
  let confidence = Math.min(1, Math.max(0, Number(json.confidence) || 0.7));
  const mealType = parseMealType(json.mealType);
  const servingGrams = parseServingGramsFromJson(json);

  const notFood =
    locale === "ru"
      ? json.description?.toLowerCase().includes("не еда") ||
        json.description?.toLowerCase().includes("неизвестный")
      : json.description?.toLowerCase().includes("not food") ||
        json.description?.toLowerCase().includes("unknown product");
  if (notFood || (mealType === "unknown" && confidence < 0.3)) {
    confidence = Math.min(confidence, 0.29);
  }

  const rawDescription = json.description ?? (locale === "ru" ? "Блюдо" : "Meal");

  return {
    description: descriptionWithPortion(rawDescription, servingGrams),
    calories,
    protein,
    carbs: Math.round(Number(json.carbs) || estimated.carbs),
    fat: Math.round(Number(json.fat) || estimated.fat),
    servingGrams,
    confidence,
    mealType,
    source,
    imageHash,
    cacheHit: false,
  };
}

export function parseMealJsonResponse(
  raw: string,
  locale: AppLocale,
  source: MealAnalysis["source"],
  imageHash?: string,
): MealAnalysis {
  const json = JSON.parse(extractJsonObject(raw)) as RawMealJson;
  return buildMealAnalysis(json, locale, source, imageHash);
}
