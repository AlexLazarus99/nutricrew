import { describe, expect, it } from "vitest";
import { validateMealPatch } from "./mealEdit.js";
import { scoreAnomalyFlags } from "./birdGameAntiCheat.js";
import { insightText } from "./trends.js";

describe("validateMealPatch", () => {
  it("rejects empty patch", () => {
    expect(validateMealPatch({}).ok).toBe(false);
  });

  it("accepts valid macros", () => {
    const r = validateMealPatch({ calories: 400, protein: 25 });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.patch.calories).toBe(400);
      expect(r.patch.protein).toBe(25);
    }
  });

  it("rejects invalid description", () => {
    expect(validateMealPatch({ description: "x" }).ok).toBe(false);
  });
});

describe("scoreAnomalyFlags", () => {
  it("flags extreme scores", () => {
    const flags = scoreAnomalyFlags(9000, 60, 10);
    expect(flags).toContain("score_extreme");
  });

  it("passes normal scores", () => {
    const flags = scoreAnomalyFlags(320, 120, 8);
    expect(flags.length).toBe(0);
  });
});

describe("insightText", () => {
  it("returns localized strings", () => {
    expect(insightText("protein_low", "ru")).toContain("Белка");
    expect(insightText("protein_low", "en")).toContain("Protein");
  });
});
