export type QuestPeriod = "daily" | "weekly" | "once";

export type QuestMetric =
  | "meals_today"
  | "meals_week"
  | "streak_days"
  | "today_points"
  | "has_team"
  | "team_logged_today"
  | "daily_bonus_game"
  | "daily_bonus_quiz"
  | "bird_best_score"
  | "total_meals";

export type QuestRewards = {
  xp: number;
  team: number;
  stars: number;
};

export type QuestDef = {
  id: string;
  period: QuestPeriod;
  titleKey: string;
  descKey: string;
  emoji: string;
  target: number;
  metric: QuestMetric;
  rewards: QuestRewards;
  sort: number;
};

export const QUEST_DEFINITIONS: QuestDef[] = [
  // —— Daily ——
  {
    id: "daily_first_meal",
    period: "daily",
    titleKey: "first_meal",
    descKey: "first_meal",
    emoji: "🌅",
    target: 1,
    metric: "meals_today",
    rewards: { xp: 15, team: 10, stars: 0 },
    sort: 10,
  },
  {
    id: "daily_three_meals",
    period: "daily",
    titleKey: "three_meals",
    descKey: "three_meals",
    emoji: "🍽️",
    target: 3,
    metric: "meals_today",
    rewards: { xp: 40, team: 25, stars: 0 },
    sort: 20,
  },
  {
    id: "daily_points_50",
    period: "daily",
    titleKey: "points_50",
    descKey: "points_50",
    emoji: "⚡",
    target: 50,
    metric: "today_points",
    rewards: { xp: 20, team: 15, stars: 0 },
    sort: 30,
  },
  {
    id: "daily_streak",
    period: "daily",
    titleKey: "keep_streak",
    descKey: "keep_streak",
    emoji: "🔥",
    target: 1,
    metric: "streak_days",
    rewards: { xp: 18, team: 12, stars: 0 },
    sort: 40,
  },
  {
    id: "daily_nutribird",
    period: "daily",
    titleKey: "nutribird",
    descKey: "nutribird",
    emoji: "🐦",
    target: 1,
    metric: "daily_bonus_game",
    rewards: { xp: 25, team: 18, stars: 0 },
    sort: 50,
  },
  {
    id: "daily_quiz",
    period: "daily",
    titleKey: "quiz",
    descKey: "quiz",
    emoji: "🧠",
    target: 1,
    metric: "daily_bonus_quiz",
    rewards: { xp: 25, team: 18, stars: 0 },
    sort: 60,
  },
  {
    id: "daily_crew_meal",
    period: "daily",
    titleKey: "crew_meal",
    descKey: "crew_meal",
    emoji: "🤝",
    target: 1,
    metric: "has_team",
    rewards: { xp: 12, team: 20, stars: 0 },
    sort: 70,
  },

  // —— Weekly challenges ——
  {
    id: "weekly_meals_10",
    period: "weekly",
    titleKey: "meals_10",
    descKey: "meals_10",
    emoji: "📅",
    target: 10,
    metric: "meals_week",
    rewards: { xp: 70, team: 50, stars: 0 },
    sort: 100,
  },
  {
    id: "weekly_meals_20",
    period: "weekly",
    titleKey: "meals_20",
    descKey: "meals_20",
    emoji: "🏃",
    target: 20,
    metric: "meals_week",
    rewards: { xp: 120, team: 90, stars: 1 },
    sort: 110,
  },
  {
    id: "weekly_streak_5",
    period: "weekly",
    titleKey: "streak_5",
    descKey: "streak_5",
    emoji: "🔥",
    target: 5,
    metric: "streak_days",
    rewards: { xp: 90, team: 60, stars: 0 },
    sort: 120,
  },
  {
    id: "weekly_team_active",
    period: "weekly",
    titleKey: "team_active",
    descKey: "team_active",
    emoji: "👥",
    target: 2,
    metric: "team_logged_today",
    rewards: { xp: 50, team: 40, stars: 0 },
    sort: 130,
  },
  {
    id: "weekly_bird_300",
    period: "weekly",
    titleKey: "bird_300",
    descKey: "bird_300",
    emoji: "🎮",
    target: 300,
    metric: "bird_best_score",
    rewards: { xp: 80, team: 55, stars: 0 },
    sort: 140,
  },
  {
    id: "weekly_meals_15",
    period: "weekly",
    titleKey: "meals_15",
    descKey: "meals_15",
    emoji: "✨",
    target: 15,
    metric: "meals_week",
    rewards: { xp: 150, team: 100, stars: 2 },
    sort: 150,
  },

  // —— One-time ——
  {
    id: "once_first_meal",
    period: "once",
    titleKey: "once_first_meal",
    descKey: "once_first_meal",
    emoji: "🥇",
    target: 1,
    metric: "total_meals",
    rewards: { xp: 30, team: 20, stars: 0 },
    sort: 200,
  },
  {
    id: "once_join_team",
    period: "once",
    titleKey: "once_join_team",
    descKey: "once_join_team",
    emoji: "🛡️",
    target: 1,
    metric: "has_team",
    rewards: { xp: 35, team: 30, stars: 0 },
    sort: 210,
  },
  {
    id: "once_bird_fly",
    period: "once",
    titleKey: "once_bird_fly",
    descKey: "once_bird_fly",
    emoji: "🐣",
    target: 50,
    metric: "bird_best_score",
    rewards: { xp: 25, team: 15, stars: 0 },
    sort: 220,
  },
];

export function getQuestById(id: string): QuestDef | undefined {
  return QUEST_DEFINITIONS.find((q) => q.id === id);
}
