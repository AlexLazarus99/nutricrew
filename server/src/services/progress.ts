import * as mealsRepo from "../repositories/meals.js";
import * as engagementRepo from "../repositories/engagement.js";
import * as birdGameRepo from "../repositories/birdGame.js";
import * as questsRepo from "../repositories/quests.js";
import type { DbUser } from "../types.js";

export type ProgressPayload = {
  xp: number;
  level: number;
  titleKey: string;
  emoji: string;
  xpInLevel: number;
  xpToNext: number;
  percent: number;
  maxLevel: boolean;
};

const LEVELS: Array<{ level: number; xp: number; titleKey: string; emoji: string }> = [
  { level: 1, xp: 0, titleKey: "hatchling", emoji: "🥚" },
  { level: 2, xp: 40, titleKey: "sprout", emoji: "🌱" },
  { level: 3, xp: 100, titleKey: "snacker", emoji: "🥗" },
  { level: 4, xp: 200, titleKey: "logger", emoji: "📸" },
  { level: 5, xp: 350, titleKey: "regular", emoji: "⭐" },
  { level: 6, xp: 550, titleKey: "balanced", emoji: "⚖️" },
  { level: 7, xp: 800, titleKey: "protein", emoji: "💪" },
  { level: 8, xp: 1100, titleKey: "crewmate", emoji: "🤝" },
  { level: 9, xp: 1500, titleKey: "chef", emoji: "👨‍🍳" },
  { level: 10, xp: 2000, titleKey: "hawk", emoji: "🦅" },
  { level: 11, xp: 2700, titleKey: "streaker", emoji: "🔥" },
  { level: 12, xp: 3600, titleKey: "captain", emoji: "🧢" },
  { level: 13, xp: 4800, titleKey: "champion", emoji: "🏅" },
  { level: 14, xp: 6300, titleKey: "master", emoji: "🎖️" },
  { level: 15, xp: 8200, titleKey: "legend", emoji: "👑" },
];

export function getLevelTable() {
  return LEVELS;
}

export async function computeUserProgress(user: DbUser): Promise<ProgressPayload> {
  const mealPoints = await mealsRepo.getLifetimeMealPoints(user.id);
  const bonusCount = await engagementRepo.countDailyBonuses(user.id);
  const birdBest = await birdGameRepo.getBestScore(user.id);

  const questXp = await questsRepo.sumClaimedXp(user.id);

  const xp =
    mealPoints +
    user.current_streak * 25 +
    user.longest_streak * 10 +
    bonusCount * 12 +
    Math.min(500, Math.floor((birdBest?.score ?? 0) / 4)) +
    questXp;

  return xpToProgress(xp);
}

export function xpToProgress(xp: number): ProgressPayload {
  const total = Math.max(0, Math.floor(xp));
  let current = LEVELS[0]!;
  let next = LEVELS[1];

  for (let i = LEVELS.length - 1; i >= 0; i -= 1) {
    if (total >= LEVELS[i]!.xp) {
      current = LEVELS[i]!;
      next = LEVELS[i + 1];
      break;
    }
  }

  if (!next) {
    return {
      xp: total,
      level: current.level,
      titleKey: current.titleKey,
      emoji: current.emoji,
      xpInLevel: total - current.xp,
      xpToNext: 0,
      percent: 100,
      maxLevel: true,
    };
  }

  const xpInLevel = total - current.xp;
  const xpToNext = next.xp - current.xp;
  const percent = xpToNext > 0 ? Math.min(100, Math.round((xpInLevel / xpToNext) * 100)) : 100;

  return {
    xp: total,
    level: current.level,
    titleKey: current.titleKey,
    emoji: current.emoji,
    xpInLevel,
    xpToNext,
    percent,
    maxLevel: false,
  };
}
