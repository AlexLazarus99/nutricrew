import { FOOD_ITEMS, type FoodCategory, type FoodItem } from "../../data/calorieQuiz/foods";

export type QuizQuestion = {
  food: FoodItem;
  correctKcal: number;
  options: number[];
};

export const QUESTIONS_PER_GAME = 50;
export const UNIQUE_BEFORE_REPEAT = 50;

export const LAST_SESSION_KEY = "nutricrew-calorie-quiz-last-session";
export const TOTAL_SEEN_KEY = "nutricrew-calorie-quiz-total-seen";
export const QUIZ_BEST_KEY = "nutricrew-calorie-quiz-best";

export type QuizDeck = {
  queue: string[];
  category?: FoodCategory;
  lastId?: string;
  sessionIds: string[];
  /** 0 before first question; increments after each draw. */
  questionNumber: number;
};

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function poolForCategory(category?: FoodCategory): FoodItem[] {
  if (!category) return FOOD_ITEMS;
  return FOOD_ITEMS.filter((f) => f.category === category);
}

function loadJsonArray(key: string): string[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function saveJsonArray(key: string, ids: string[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(ids));
  } catch {
    /* ignore */
  }
}

export function loadLastSessionIds(): string[] {
  return loadJsonArray(LAST_SESSION_KEY);
}

export function saveLastSessionIds(ids: string[]): void {
  saveJsonArray(LAST_SESSION_KEY, ids);
}

export function loadTotalSeenIds(): string[] {
  return loadJsonArray(TOTAL_SEEN_KEY);
}

export function rememberSeenIds(ids: string[]): string[] {
  const merged = [...loadTotalSeenIds()];
  for (const id of ids) {
    if (!merged.includes(id)) merged.push(id);
  }
  saveJsonArray(TOTAL_SEEN_KEY, merged);
  return merged;
}

function buildSessionQueue(category?: FoodCategory, excludeIds: string[] = []): string[] {
  const pool = poolForCategory(category);
  const target = Math.min(QUESTIONS_PER_GAME, pool.length);
  const totalSeen = loadTotalSeenIds();
  const excludeSet = new Set(excludeIds);

  let fresh = shuffle(pool.filter((f) => !excludeSet.has(f.id)));

  if (fresh.length >= target) {
    return fresh.slice(0, target).map((f) => f.id);
  }

  const queue = fresh.map((f) => f.id);

  if (totalSeen.length >= UNIQUE_BEFORE_REPEAT && queue.length < target) {
    const repeatPool = shuffle(pool.filter((f) => excludeSet.has(f.id)));
    for (const item of repeatPool) {
      if (queue.length >= target) break;
      if (!queue.includes(item.id)) queue.push(item.id);
    }
  }

  if (queue.length < target) {
    for (const item of shuffle(pool)) {
      if (queue.length >= target) break;
      if (!queue.includes(item.id)) queue.push(item.id);
    }
  }

  return queue.slice(0, target);
}

/** New 50-question round — prefers products not used in the previous round. */
export function createDeck(category?: FoodCategory): QuizDeck {
  const excludeIds = loadLastSessionIds();
  const queue = buildSessionQueue(category, excludeIds);
  return { queue, category, sessionIds: [], questionNumber: 0 };
}

export function questionsInDeck(deck: QuizDeck): number {
  return deck.queue.length + deck.questionNumber;
}

export function isGameComplete(deck: QuizDeck): boolean {
  return deck.queue.length === 0 && deck.questionNumber > 0;
}

export function drawFromDeck(deck: QuizDeck): { deck: QuizDeck; food: FoodItem } | null {
  if (deck.queue.length === 0) return null;

  const id = deck.queue[0];
  const nextQueue = deck.queue.slice(1);
  const sessionIds = deck.sessionIds.includes(id) ? deck.sessionIds : [...deck.sessionIds, id];
  const food = FOOD_ITEMS.find((f) => f.id === id)!;
  return {
    deck: {
      category: deck.category,
      lastId: id,
      queue: nextQueue,
      sessionIds,
      questionNumber: deck.questionNumber + 1,
    },
    food,
  };
}

function snapKcal(value: number, correct: number): number {
  const step = correct < 30 ? 1 : correct < 120 ? 5 : 10;
  return Math.max(step, Math.round(value / step) * step);
}

function generateWrongOptions(correct: number): number[] {
  const wrong = new Set<number>();
  const multipliers = [0.45, 0.6, 0.75, 0.85, 1.15, 1.3, 1.5, 1.75];
  let guard = 0;

  while (wrong.size < 3 && guard < 80) {
    guard += 1;
    const pick =
      guard % 3 === 0
        ? correct + (Math.random() > 0.5 ? 1 : -1) * Math.round(15 + Math.random() * 90)
        : Math.round(correct * multipliers[Math.floor(Math.random() * multipliers.length)]);
    const candidate = snapKcal(pick, correct);
    if (candidate !== correct && candidate > 0 && candidate < 980) {
      wrong.add(candidate);
    }
  }

  const fallbacks = [-40, -25, -15, 15, 25, 40, 60, 80, -60];
  for (const delta of fallbacks) {
    if (wrong.size >= 3) break;
    const candidate = snapKcal(correct + delta, correct);
    if (candidate !== correct && candidate > 0) wrong.add(candidate);
  }

  return [...wrong].slice(0, 3);
}

export function buildQuestionFromFood(food: FoodItem): QuizQuestion {
  const correctKcal = food.calories;
  const options = shuffle([correctKcal, ...generateWrongOptions(correctKcal)]);
  return { food, correctKcal, options };
}

export function nextQuestion(deck: QuizDeck): { deck: QuizDeck; question: QuizQuestion } | null {
  const drawn = drawFromDeck(deck);
  if (!drawn) return null;
  return {
    deck: drawn.deck,
    question: buildQuestionFromFood(drawn.food),
  };
}

export function finishGame(deck: QuizDeck): void {
  if (deck.sessionIds.length > 0) {
    saveLastSessionIds(deck.sessionIds);
    rememberSeenIds(deck.sessionIds);
  }
}

export function loadBestScore(): number {
  try {
    const raw = localStorage.getItem(QUIZ_BEST_KEY);
    if (!raw) return 0;
    const n = Number.parseInt(raw, 10);
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

export function saveBestScore(score: number): void {
  try {
    localStorage.setItem(QUIZ_BEST_KEY, String(score));
  } catch {
    /* ignore */
  }
}
