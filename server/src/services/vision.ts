import { config } from "../config.js";
import type { AppLocale, MealAnalysis, MealType } from "../types.js";

const MEAL_TYPES = new Set<MealType>([
  "breakfast",
  "lunch",
  "dinner",
  "snack",
  "drink",
  "unknown",
]);

function buildFoodPrompt(locale: AppLocale): string {
  const lang = locale === "ru" ? "Russian" : "English";
  const notFood = locale === "ru" ? "Не еда" : "Not food";

  return `You are a nutrition vision assistant for NutriCrew (Telegram miniapp).

Estimate the portion realistically (typical home or café serving, not an ideal nutrition label).

Respond with ONLY valid JSON (no markdown):
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

export async function analyzeFoodImage(
  base64Image: string,
  locale: AppLocale = "en",
): Promise<MealAnalysis> {
  const dataUrl = base64Image.startsWith("data:")
    ? base64Image
    : `data:image/jpeg;base64,${base64Image}`;

  if (!config.openaiApiKey) {
    return fallbackAnalysis();
  }

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
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: buildFoodPrompt(locale) },
              { type: "image_url", image_url: { url: dataUrl } },
            ],
          },
        ],
      }),
    });

    if (!res.ok) {
      console.error("OpenAI vision error", await res.text());
      return fallbackAnalysis();
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const raw = data.choices?.[0]?.message?.content?.trim() ?? "";
    const json = JSON.parse(raw.replace(/^```json?\s*|\s*```$/g, "")) as {
      description?: string;
      calories?: number;
      protein?: number;
      carbs?: number;
      fat?: number;
      confidence?: number;
      mealType?: string;
    };

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
      source: "openai",
    };
  } catch (err) {
    console.error("Vision parse failed", err);
    return fallbackAnalysis();
  }
}

function fallbackAnalysis(): MealAnalysis {
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
  };
}
