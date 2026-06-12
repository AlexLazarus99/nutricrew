import { describe, expect, it } from "vitest";
import { buildNutritionInsight, extractMicronutrients } from "./nutritionRemarks.js";

describe("nutritionRemarks", () => {
  it("extracts micronutrients from OpenFoodFacts nutriments", () => {
    const micro = extractMicronutrients({
      potassium_100g: 420,
      magnesium_100g: 65,
      proteins_100g: 12,
    });
    expect(micro.potassiumMg).toBe(420);
    expect(micro.magnesiumMg).toBe(65);
    expect(micro.proteinG).toBe(12);
  });

  it("builds rich potassium remark from OFF data", () => {
    const insight = buildNutritionInsight({
      name: "Banana chips",
      locale: "ru",
      micro: { potassiumMg: 520, proteinG: 2 },
    });
    expect(insight.remarks.some((r) => r.includes("кали"))).toBe(true);
  });

  it("falls back to name heuristics for dairy", () => {
    const insight = buildNutritionInsight({
      name: "Творог 5% Простоквашино",
      locale: "ru",
      proteinG: 16,
    });
    expect(insight.remarks.length).toBeGreaterThan(0);
    expect(insight.encyclopedia).toBeTruthy();
  });
});
