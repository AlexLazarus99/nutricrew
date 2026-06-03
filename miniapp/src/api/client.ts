import { getApiBase } from "../lib/apiBase.js";

export const API_ERROR = {
  UNREACHABLE: "API_UNREACHABLE",
  BAD_RESPONSE: "API_BAD_RESPONSE",
  TIMEOUT: "API_TIMEOUT",
  STARTING: "API_STARTING",
  TELEGRAM_REQUIRED: "TELEGRAM_REQUIRED",
  BOT_NOT_CONFIGURED: "BOT_NOT_CONFIGURED",
  INVALID_TELEGRAM_AUTH: "INVALID_TELEGRAM_AUTH",
} as const;

const REQUEST_TIMEOUT_MS = 28_000;

async function fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

import { getTelegramInitData } from "../lib/telegramReady.js";

function getInitData(): string {
  return getTelegramInitData();
}

function mapFetchError(err: unknown): Error {
  if (err instanceof DOMException && err.name === "AbortError") {
    return new Error(API_ERROR.TIMEOUT);
  }
  if (err instanceof TypeError) {
    return new Error(API_ERROR.UNREACHABLE);
  }
  if (err instanceof Error) {
    return err;
  }
  return new Error(String(err));
}

async function parseJsonBody<T>(res: Response): Promise<T> {
  const text = await res.text();
  const trimmed = text.trimStart();

  if (trimmed.startsWith("<")) {
    throw new Error(API_ERROR.BAD_RESPONSE);
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(API_ERROR.BAD_RESPONSE);
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const apiBase = getApiBase();
  let res: Response;

  try {
    res = await fetchWithTimeout(`${apiBase}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "X-Telegram-Init-Data": getInitData(),
        ...options?.headers,
      },
    });
  } catch (err) {
    throw mapFetchError(err);
  }

  if (!res.ok) {
    let body: { error?: string; message?: string } = {};
    try {
      body = await parseJsonBody<{ error?: string; message?: string }>(res);
    } catch {
      /* HTML or invalid JSON */
    }
    const message = body.message ?? body.error ?? `HTTP ${res.status}`;
    if (res.status === 503 && (body as { code?: string }).code === "STARTING") {
      throw new Error(API_ERROR.STARTING);
    }
    if (message === "Server starting") {
      throw new Error(API_ERROR.STARTING);
    }
    if (message === "Bot token not configured") {
      throw new Error(API_ERROR.BOT_NOT_CONFIGURED);
    }
    if (
      message === "Missing Telegram init data" ||
      message === "Invalid init data" ||
      message === "Expired or malformed init data"
    ) {
      throw new Error(
        message === "Missing Telegram init data"
          ? API_ERROR.TELEGRAM_REQUIRED
          : API_ERROR.INVALID_TELEGRAM_AUTH,
      );
    }
    throw new Error(message);
  }

  return parseJsonBody<T>(res);
}

export interface MeResponse {
  user: {
    id: number;
    firstName: string;
    lastName?: string;
    username?: string;
    languageCode?: string;
  };
  profileComplete: boolean;
  weightKg: number | null;
  heightCm: number | null;
  age: number | null;
  teamId: string | null;
  inviteCode: string | null;
  inviteUrl: string | null;
  botUsername: string | null;
  startParam?: string | null;
  startInviteCode?: string | null;
  streak: { days: number; multiplier: number };
  teamMultiplier: number;
  teamMemberCount: number;
  minTeamForPrizes: number;
  mealsToday: number;
  mealsTodayTarget: number;
  todayPoints: number;
  starBalance: number;
  dailyBonus: { game: boolean; quiz: boolean };
  timezoneOffsetMinutes: number | null;
}

export interface TeamActivityItem {
  id: string;
  userName: string;
  description: string;
  points: number;
  createdAt: string;
  isYou?: boolean;
}

export interface PrizesResponse {
  starBalance: number;
  pool: {
    weekKey: string;
    starsTotal: number;
    starsDistributed: number;
    starsAvailable: number;
  } | null;
  teamPremium: boolean;
  premiumPrice: number;
  awards: Array<{ weekKey: string; stars: number; at: string }>;
}

export interface TeamResponse {
  id: string;
  name: string;
  inviteCode: string;
  members: Array<{
    id: number;
    name: string;
    points: number;
    loggedToday: boolean;
  }>;
  weeklyGoal: {
    type: string;
    target: number;
    current: number;
    unit: string;
  };
  rank: number;
  totalTeams: number;
  isPremium?: boolean;
}

export interface LeaderboardResponse {
  week: string;
  teams: Array<{ rank: number; name: string; points: number }>;
}

export interface BirdGameLeaderboardEntry {
  rank: number;
  name: string;
  score: number;
  level: number;
  fruits: number;
  isYou?: boolean;
}

export interface BirdGameLeaderboardResponse {
  entries: BirdGameLeaderboardEntry[];
}

export interface MealAnalysisResponse {
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  confidence: number;
  source: "openai" | "fallback";
}

export interface MealResponse {
  id: string;
  points: number;
  teamPoints: number;
  streak: number;
  mealsToday?: number;
  inviteUrl?: string | null;
  message: string;
}

export interface DiaryMealEntry {
  id: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  points: number;
  photoUrl: string | null;
  createdAt: string;
}

export interface DiaryResponse {
  meals: DiaryMealEntry[];
  totals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    count: number;
  };
}

const ME_RETRY_DELAYS_MS = [0, 2000, 4000, 6000];

function isRetryableMeError(message: string): boolean {
  return (
    message === API_ERROR.TIMEOUT ||
    message === API_ERROR.UNREACHABLE ||
    message === API_ERROR.STARTING
  );
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export const api = {
  getMe: async () => {
    let lastErr: Error | null = null;
    for (let i = 0; i < ME_RETRY_DELAYS_MS.length; i++) {
      if (ME_RETRY_DELAYS_MS[i] > 0) {
        await sleep(ME_RETRY_DELAYS_MS[i]);
      }
      try {
        return await request<MeResponse>("/me");
      } catch (e) {
        lastErr = e as Error;
        if (!isRetryableMeError(lastErr.message) || i === ME_RETRY_DELAYS_MS.length - 1) {
          throw lastErr;
        }
      }
    }
    throw lastErr ?? new Error(API_ERROR.UNREACHABLE);
  },
  getTeam: () => request<TeamResponse>("/team"),
  getLeaderboard: () => request<LeaderboardResponse>("/leaderboard"),
  getBirdLeaderboard: () => request<BirdGameLeaderboardResponse>("/game/leaderboard"),
  submitBirdScore: (body: { score: number; level: number; fruits: number }) =>
    request<{ ok: boolean; improved: boolean }>("/game/score", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  analyzeMeal: (imageBase64: string) =>
    request<MealAnalysisResponse>("/meals/analyze", {
      method: "POST",
      body: JSON.stringify({ imageBase64 }),
    }),
  logMeal: (body: {
    description: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    imageBase64?: string;
  }) => request<MealResponse>("/meals", { method: "POST", body: JSON.stringify(body) }),
  getMealDiary: (dayStart: string, dayEnd: string) =>
    request<DiaryResponse>(
      `/meals/diary?dayStart=${encodeURIComponent(dayStart)}&dayEnd=${encodeURIComponent(dayEnd)}`,
    ),
  getPrizes: () => request<PrizesResponse>("/prizes"),
  createFundInvoice: (stars: number) =>
    request<{ invoiceLink: string }>("/prizes/fund-invoice", {
      method: "POST",
      body: JSON.stringify({ stars }),
    }),
  createPremiumInvoice: () =>
    request<{ invoiceLink: string }>("/prizes/premium-invoice", { method: "POST", body: "{}" }),
  createTeam: (name: string) =>
    request<{ id: string; name: string; inviteCode: string }>("/teams/create", {
      method: "POST",
      body: JSON.stringify({ name }),
    }),
  joinTeam: (code: string, referrerTelegramId?: number) =>
    request<{ id: string; name: string; inviteCode: string }>("/teams/join", {
      method: "POST",
      body: JSON.stringify({ code, referrerTelegramId }),
    }),
  getTeamActivity: () =>
    request<{ items: TeamActivityItem[] }>("/team/activity"),
  claimDailyBonus: (type: "game" | "quiz") =>
    request<{ claimed: boolean; points: number }>("/engagement/daily-bonus", {
      method: "POST",
      body: JSON.stringify({ type }),
    }),
  setTimezone: (offsetMinutes: number) =>
    request<{ ok: boolean }>("/me/timezone", {
      method: "PATCH",
      body: JSON.stringify({ offsetMinutes }),
    }),
  setLocale: (locale: "en" | "ru") =>
    request<{ ok: boolean }>("/me/locale", {
      method: "PATCH",
      body: JSON.stringify({ locale }),
    }),
  completeProfile: (weightKg: number, heightCm: number, age: number) =>
    request<{
      ok: boolean;
      profileComplete: boolean;
      weightKg: number;
      heightCm: number;
      age: number;
    }>("/me/profile", {
      method: "PATCH",
      body: JSON.stringify({ weightKg, heightCm, age }),
    }),
};
