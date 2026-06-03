export type TeamChallengeDef = {
  id: string;
  titleKey: string;
  descKey: string;
  emoji: string;
  target: number;
  metric: "team_meals_week" | "team_protein_week";
};

export const ACTIVE_TEAM_CHALLENGE: TeamChallengeDef = {
  id: "crew_21_meals",
  titleKey: "crew21Meals",
  descKey: "crew21MealsDesc",
  emoji: "🥗",
  target: 21,
  metric: "team_meals_week",
};

export const BATTLE_PASS_XP_PER_TIER = 100;
export const BATTLE_PASS_MAX_TIER = 20;
export const CURRENT_SEASON_KEY = "2026-S1";

export const KUDOS_EMOJIS = ["🔥", "💪", "🥗", "👏"] as const;
