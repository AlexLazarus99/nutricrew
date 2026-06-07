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
  progress: {
    xp: number;
    level: number;
    titleKey: string;
    emoji: string;
    xpInLevel: number;
    xpToNext: number;
    percent: number;
    maxLevel: boolean;
  };
  socialLinks: Partial<{
    telegramChannel: string;
    telegramGroup: string;
    instagram: string;
    x: string;
    youtube: string;
    tiktok: string;
  }>;
  growth?: GrowthSummary;
}

export type GrowthSummary = {
  streakFreezes: number;
  league: { tier: string; weeklyXp: number; xpToNext: number };
  dailyGoal: { type: string; target: number; progress: number; done: boolean };
  birdBoost: { active: boolean; until: string | null };
};

export type GrowthPayload = GrowthSummary & {
  onboardingVariant: string;
  photoPrivacy: string;
  doublePoints: { available: boolean; usedWeekKey: string | null };
  favorites: Array<{
    id: string;
    description: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    useCount: number;
  }>;
  challenge: {
    id: string;
    titleKey: string;
    descKey: string;
    emoji: string;
    progress: number;
    target: number;
    completed: boolean;
  } | null;
  duel: {
    id: string;
    youName: string;
    foeName: string;
    yourPoints: number;
    foePoints: number;
  } | null;
  teamRole: string | null;
  corpLeaderboard: Array<{ rank: number; name: string; points: number }>;
  achievements: Array<{
    id: string;
    titleKey: string;
    descKey: string;
    emoji: string;
    unlocked: boolean;
    unlockedAt: string | null;
  }>;
  battlePass: {
    seasonKey: string;
    tier: number;
    maxTier: number;
    xp: number;
    xpPerTier: number;
  };
  kudosEmojis: string[];
  premiumPerks: {
    streakFreezeGrant: boolean;
    doublePointsDay: boolean;
    photoPrivacyOptions: string[];
  };
};

export type QuestStatus = "locked" | "active" | "ready" | "claimed";

export interface QuestItem {
  id: string;
  period: "daily" | "weekly" | "once";
  titleKey: string;
  descKey: string;
  emoji: string;
  target: number;
  progress: number;
  status: QuestStatus;
  rewards: { xp: number; team: number; stars: number };
  periodKey: string;
}

export interface QuestBoard {
  daily: QuestItem[];
  weekly: QuestItem[];
  once: QuestItem[];
  readyCount: number;
  claimedToday: number;
}

export interface TeamActivityItem {
  id: string;
  userName: string;
  description: string;
  points: number;
  createdAt: string;
  isYou?: boolean;
  kudosCount?: number;
  kudos?: string[];
  photoUrl?: string | null;
  qualityTag?: string | null;
  mealSlot?: string | null;
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

export interface BirdTrialEntry {
  id: string;
  requiredLevel: number;
  rewardStars: number;
  completed: boolean;
}

export interface BirdCatalogRow {
  id: string;
  starPrice: number;
  invoiceStars: number;
  xpPrice: number | null;
  starsOnly: boolean;
  free: boolean;
  owned: boolean;
  trials: BirdTrialEntry[];
}

export interface BirdRosterResponse {
  selectedBirdId: string;
  starBalance: number;
  totalXp: number;
  spentXp: number;
  availableXp: number;
  birds: BirdCatalogRow[];
  trialsCompleted: string[];
}

export interface BirdScoreResponse {
  ok: boolean;
  improved: boolean;
  trials?: {
    newlyCompleted: Array<{ trialId: string; rewardStars: number }>;
    starBalance: number;
  };
}

export type MealType =
  | "breakfast"
  | "lunch"
  | "dinner"
  | "snack"
  | "drink"
  | "unknown";

export type VisionFallbackReason = "no_key" | "api_error" | "parse_error";

export interface MealAnalysisResponse {
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  confidence: number;
  mealType?: MealType;
  source: "openai" | "fallback";
  visionReason?: VisionFallbackReason;
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

const ME_RETRY_DELAYS_MS = [0, 3000, 5000, 8000, 10_000, 12_000];

export function isRetryableMeError(message: string): boolean {
  return (
    message === API_ERROR.TIMEOUT ||
    message === API_ERROR.UNREACHABLE ||
    message === API_ERROR.STARTING
  );
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export type ChatReaction = {
  emoji: string;
  count: number;
  mine: boolean;
};

export type ChatMessage = {
  id: string;
  authorName: string;
  authorId: number | null;
  body: string;
  displayBody: string;
  isHidden: boolean;
  isSystem: boolean;
  isMine: boolean;
  hiddenReason: string | null;
  createdAt: string;
  reactions: ChatReaction[];
};

export type ChatMessagesResponse = {
  messages: ChatMessage[];
  reactions: string[];
};

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
  submitBirdScore: (body: { score: number; level: number; fruits: number; birdId?: string }) =>
    request<BirdScoreResponse>("/game/score", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  getGameBirds: () => request<BirdRosterResponse>("/game/birds"),
  selectGameBird: (birdId: string) =>
    request<{ ok: boolean; selectedBirdId: string }>("/game/birds/select", {
      method: "POST",
      body: JSON.stringify({ birdId }),
    }),
  unlockGameBirdStars: (birdId: string) =>
    request<{ ok: boolean; starBalance: number; selectedBirdId: string }>(
      "/game/birds/unlock-stars",
      { method: "POST", body: JSON.stringify({ birdId }) },
    ),
  unlockGameBirdXp: (birdId: string) =>
    request<{ ok: boolean; availableXp: number; selectedBirdId: string }>(
      "/game/birds/unlock-xp",
      { method: "POST", body: JSON.stringify({ birdId }) },
    ),
  createGameBirdInvoice: (birdId: string) =>
    request<{ invoiceLink: string }>("/game/birds/invoice", {
      method: "POST",
      body: JSON.stringify({ birdId }),
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
    mealSlot?: string;
    qualityTag?: string;
    favoriteId?: string;
  }) => request<MealResponse>("/meals", { method: "POST", body: JSON.stringify(body) }),
  postMealKudos: (mealId: string, emoji: string) =>
    request<{ ok: boolean; added: boolean; kudosCount: number }>(
      `/meals/${encodeURIComponent(mealId)}/kudos`,
      { method: "POST", body: JSON.stringify({ emoji }) },
    ),
  getGrowth: () => request<GrowthPayload>("/growth"),
  patchGrowthSettings: (body: {
    dailyGoalType?: string;
    dailyGoalTarget?: number;
    photoPrivacy?: string;
    onboardingVariant?: string;
  }) =>
    request<{ ok: boolean; growth: GrowthPayload }>("/growth/settings", {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  buyStreakFreeze: (useStars: boolean) =>
    request<{ ok: boolean; streakFreezes: number; starBalance: number }>(
      "/growth/streak-freeze/buy",
      { method: "POST", body: JSON.stringify({ useStars }) },
    ),
  useStreakFreeze: () =>
    request<{ ok: boolean }>("/growth/streak-freeze/use", { method: "POST", body: "{}" }),
  activateDoublePoints: () =>
    request<{ ok: boolean; weekKey: string }>("/growth/double-points", {
      method: "POST",
      body: "{}",
    }),
  startDuel: () =>
    request<{ ok: boolean; duel?: { id: string; foeName: string }; error?: string }>(
      "/growth/duel/start",
      { method: "POST", body: "{}" },
    ),
  saveFavorite: (body: {
    description: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }) =>
    request<{ id: string }>("/growth/favorites", {
      method: "POST",
      body: JSON.stringify(body),
    }),
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
  createTeam: (name: string, leagueTag?: string) =>
    request<{ id: string; name: string; inviteCode: string }>("/teams/create", {
      method: "POST",
      body: JSON.stringify({ name, leagueTag }),
    }),
  joinTeam: (code: string, referrerTelegramId?: number) =>
    request<{ id: string; name: string; inviteCode: string }>("/teams/join", {
      method: "POST",
      body: JSON.stringify({ code, referrerTelegramId }),
    }),
  getTeamActivity: () =>
    request<{ items: TeamActivityItem[]; kudosEmojis?: string[] }>("/team/activity"),
  getChatMessages: () => request<ChatMessagesResponse>("/chat/messages"),
  postChatMessage: (body: string) =>
    request<ChatMessagesResponse & { message: ChatMessage; moderationNotice: string | null }>(
      "/chat/messages",
      { method: "POST", body: JSON.stringify({ body }) },
    ),
  reactChatMessage: (messageId: string, emoji: string) =>
    request<{ message: ChatMessage }>(`/chat/messages/${encodeURIComponent(messageId)}/reactions`, {
      method: "POST",
      body: JSON.stringify({ emoji }),
    }),
  getQuests: () => request<QuestBoard>("/quests"),
  claimQuest: (questId: string) =>
    request<{
      ok: boolean;
      rewards: { xp: number; team: number; stars: number };
      board: QuestBoard;
      progress: MeResponse["progress"];
      starBalance: number;
    }>(`/quests/${encodeURIComponent(questId)}/claim`, { method: "POST", body: "{}" }),
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
