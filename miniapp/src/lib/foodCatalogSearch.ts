import { FOOD_ITEMS } from "../data/calorieQuiz/foods";
import type { FoodItem } from "../data/calorieQuiz/types";

export type FoodSearchHit = {
  item: FoodItem;
  score: number;
};

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[\s,.;:!?\-_/]+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2);
}

function scoreMatch(query: string, haystack: string): number {
  const q = query.trim().toLowerCase();
  if (!q) return 0;
  const h = haystack.toLowerCase();
  if (h === q) return 100;
  if (h.startsWith(q)) return 80;
  if (h.includes(q)) return 60;

  const tokens = tokenize(q);
  if (tokens.length === 0) return 0;

  let matched = 0;
  for (const token of tokens) {
    if (h.includes(token)) matched += 1;
  }
  return matched > 0 ? 30 + (matched / tokens.length) * 20 : 0;
}

export function searchFoodCatalog(
  query: string,
  getName: (id: string) => string,
  limit = 12,
): FoodSearchHit[] {
  const q = query.trim();
  if (q.length < 2) return [];

  const hits: FoodSearchHit[] = [];

  for (const item of FOOD_ITEMS) {
    const label = getName(item.id);
    const score = Math.max(
      scoreMatch(q, label),
      scoreMatch(q, item.id.replace(/_/g, " ")),
      scoreMatch(q, `${item.emoji} ${label}`),
    );
    if (score > 0) {
      hits.push({ item, score });
    }
  }

  return hits
    .sort((a, b) => b.score - a.score || a.item.id.localeCompare(b.item.id))
    .slice(0, limit);
}
