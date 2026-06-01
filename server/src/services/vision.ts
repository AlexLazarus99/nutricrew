import { config } from "../config.js";
import type { MealAnalysis } from "../types.js";

const FOOD_PROMPT = `You are a nutrition assistant. Analyze the food in the image.
Respond with ONLY valid JSON (no markdown):
{"description":"short meal name in English","calories":number,"protein":number,"carbs":number,"fat":number,"confidence":0.0-1.0}
All macro values in grams. Estimate portions realistically. If not food, set confidence below 0.3.`;

function estimateCarbsFat(calories: number, protein: number): { carbs: number; fat: number } {
  const proteinKcal = protein * 4;
  const remaining = Math.max(0, calories - proteinKcal);
  return {
    carbs: Math.round((remaining * 0.55) / 4),
    fat: Math.round((remaining * 0.45) / 9),
  };
}

export async function analyzeFoodImage(base64Image: string): Promise<MealAnalysis> {
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
        max_tokens: 300,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: FOOD_PROMPT },
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
    };

    const calories = Math.round(Number(json.calories) || 400);
    const protein = Math.round(Number(json.protein) || 20);
    const estimated = estimateCarbsFat(calories, protein);

    return {
      description: json.description ?? "Meal",
      calories,
      protein,
      carbs: Math.round(Number(json.carbs) || estimated.carbs),
      fat: Math.round(Number(json.fat) || estimated.fat),
      confidence: Math.min(1, Math.max(0, Number(json.confidence) || 0.7)),
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
    source: "fallback",
  };
}
