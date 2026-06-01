const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api";

export const API_ERROR = {
  NOT_CONFIGURED: "API_NOT_CONFIGURED",
  UNREACHABLE: "API_UNREACHABLE",
  TELEGRAM_REQUIRED: "TELEGRAM_REQUIRED",
} as const;

export function isApiMisconfigured(): boolean {
  return import.meta.env.PROD && !import.meta.env.VITE_API_URL;
}

function getInitData(): string {
  return window.Telegram?.WebApp?.initData ?? "";
}

function mapFetchError(err: unknown): Error {
  if (err instanceof TypeError) {
    if (isApiMisconfigured()) {
      return new Error(API_ERROR.NOT_CONFIGURED);
    }
    return new Error(API_ERROR.UNREACHABLE);
  }
  if (err instanceof Error) {
    return err;
  }
  return new Error(String(err));
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
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
    const body = (await res.json().catch(() => ({}))) as { error?: string; message?: string };
    const message = body.message ?? body.error ?? `HTTP ${res.status}`;
    if (message === "Missing Telegram init data" || message === "Invalid init data") {
      throw new Error(API_ERROR.TELEGRAM_REQUIRED);
    }
    throw new Error(message);
  }

  return res.json() as Promise<T>;
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
  streak: { days: number; multiplier: number };
  teamMultiplier: number;
  todayPoints: number;
  starBalance: number;
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

export const api = {
  getMe: () => request<MeResponse>("/me"),
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
  joinTeam: (code: string) =>
    request<{ id: string; name: string; inviteCode: string }>("/teams/join", {
      method: "POST",
      body: JSON.stringify({ code }),
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
