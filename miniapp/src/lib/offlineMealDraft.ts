const KEY = "nutricrew_meal_draft";

export type MealDraft = {
  description: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  qualityTag: string;
  mealSlot: string;
  savedAt: number;
};

export function saveMealDraft(draft: Omit<MealDraft, "savedAt">): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...draft, savedAt: Date.now() }));
  } catch {
    /* quota */
  }
}

export function loadMealDraft(): MealDraft | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const d = JSON.parse(raw) as MealDraft;
    if (Date.now() - d.savedAt > 7 * 24 * 60 * 60 * 1000) {
      localStorage.removeItem(KEY);
      return null;
    }
    return d;
  } catch {
    return null;
  }
}

export function clearMealDraft(): void {
  localStorage.removeItem(KEY);
}
