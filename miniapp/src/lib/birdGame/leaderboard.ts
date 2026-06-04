import { api, type BirdGameLeaderboardResponse } from "../../api/client";

export type BirdLeaderboardEntry = {
  rank: number;
  name: string;
  score: number;
  level: number;
  fruits: number;
  isYou?: boolean;
};

const LOCAL_LEADERBOARD_KEY = "nutricrew_bird_leaderboard";
const LOCAL_MAX = 20;

type LocalEntry = {
  name: string;
  score: number;
  level: number;
  fruits: number;
  at: number;
};

function loadLocal(): LocalEntry[] {
  try {
    const raw = localStorage.getItem(LOCAL_LEADERBOARD_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as LocalEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveLocal(entries: LocalEntry[]): void {
  try {
    localStorage.setItem(LOCAL_LEADERBOARD_KEY, JSON.stringify(entries.slice(0, LOCAL_MAX)));
  } catch {
    /* ignore */
  }
}

function displayName(): string {
  const u = window.Telegram?.WebApp?.initDataUnsafe?.user;
  if (!u) return "You";
  const name = [u.first_name, u.last_name].filter(Boolean).join(" ").trim();
  return name || u.username || "You";
}

function toLocalEntries(rows: BirdLeaderboardEntry[]): LocalEntry[] {
  return rows.map((r) => ({
    name: r.name,
    score: r.score,
    level: r.level,
    fruits: r.fruits,
    at: Date.now(),
  }));
}

export function saveLocalLeaderboard(entries: BirdLeaderboardEntry[]): void {
  saveLocal(toLocalEntries(entries));
}

export async function fetchBirdLeaderboard(): Promise<BirdLeaderboardEntry[]> {
  try {
    const data: BirdGameLeaderboardResponse = await api.getBirdLeaderboard();
    const entries = data.entries.map((e) => ({ ...e }));
    if (entries.length > 0) saveLocal(toLocalEntries(entries));
    return entries;
  } catch {
    const local = loadLocal()
      .sort((a, b) => b.score - a.score)
      .slice(0, LOCAL_MAX);
    return local.map((e, i) => ({
      rank: i + 1,
      name: e.name,
      score: e.score,
      level: e.level,
      fruits: e.fruits,
      isYou: e.name === displayName(),
    }));
  }
}

export async function submitBirdScore(
  score: number,
  level: number,
  fruits: number,
  birdId?: string,
): Promise<import("../../api/client").BirdScoreResponse | null> {
  const name = displayName();
  const local = loadLocal();
  const prev = local.find((e) => e.name === name);
  if (!prev || score > prev.score) {
    const next = [...local.filter((e) => e.name !== name), { name, score, level, fruits, at: Date.now() }]
      .sort((a, b) => b.score - a.score)
      .slice(0, LOCAL_MAX);
    saveLocal(next);
  }

  try {
    return await api.submitBirdScore({ score, level, fruits, birdId });
  } catch {
    return null;
  }
}
