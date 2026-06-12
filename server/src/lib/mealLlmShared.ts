import type { AppLocale, MealAnalysis, MealType } from "../types.js";

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
  confidence?: number;
  mealType?: string;
};

export function buildFoodImagePrompt(locale: AppLocale): string {
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

export function buildFoodTextPrompt(locale: AppLocale, text: string): string {
  const lang = locale === "ru" ? "Russian" : "English";

  return `You are a nutrition assistant for NutriCrew (Telegram miniapp).

The user described what they ate (voice or text). Estimate a realistic single portion.

User input: """${text}"""

Respond with ONLY valid JSON:
{"description":"short meal name in ${lang}","calories":number,"protein":number,"carbs":number,"fat":number,"confidence":0.0-1.0,"mealType":"breakfast|lunch|dinner|snack|drink|unknown"}

Rules:
- protein, carbs, fat in grams; calories in kcal.
- If not food or too vague: confidence < 0.35, mealType "unknown".
- Combine multiple items into one total.
- Typical home/café portions, not ideal label values.`;
}

export function buildBarcodeAiPrompt(
  locale: AppLocale,
  barcode: string,
  hint?: string,
): string {
  const lang = locale === "ru" ? "Russian" : "English";
  const hintLine = hint?.trim()
    ? `User hint about the product: """${hint.trim()}"""`
    : "No product name hint was provided.";

  return `You are a nutrition assistant for NutriCrew (Telegram miniapp).

A barcode was scanned but not found in product databases.
Barcode: ${barcode}
${hintLine}

Estimate the most likely packaged food for this barcode region (Russia/CIS if EAN starts with 46) and a typical serving.

Respond with ONLY valid JSON:
{"description":"product name in ${lang}","calories":number,"protein":number,"carbs":number,"fat":number,"confidence":0.0-1.0,"mealType":"snack|unknown"}

Rules:
- Macros for one typical serving (label serving or 100g if unknown).
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

  const notFood =
    locale === "ru"
      ? json.description?.toLowerCase().includes("не еда") ||
        json.description?.toLowerCase().includes("неизвестный")
      : json.description?.toLowerCase().includes("not food") ||
        json.description?.toLowerCase().includes("unknown product");
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

export function parseMealJsonResponse(
  raw: string,
  locale: AppLocale,
  source: MealAnalysis["source"],
  imageHash?: string,
): MealAnalysis {
  const json = JSON.parse(extractJsonObject(raw)) as RawMealJson;
  return buildMealAnalysis(json, locale, source, imageHash);
}
