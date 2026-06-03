export type AchievementDef = {
  id: string;
  titleKey: string;
  descKey: string;
  emoji: string;
};

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: "first_meal", titleKey: "firstMeal", descKey: "firstMealDesc", emoji: "🍽" },
  { id: "streak_7", titleKey: "streak7", descKey: "streak7Desc", emoji: "🔥" },
  { id: "streak_30", titleKey: "streak30", descKey: "streak30Desc", emoji: "💎" },
  { id: "team_join", titleKey: "teamJoin", descKey: "teamJoinDesc", emoji: "👥" },
  { id: "meals_50", titleKey: "meals50", descKey: "meals50Desc", emoji: "📸" },
  { id: "referral_1", titleKey: "referral1", descKey: "referral1Desc", emoji: "🤝" },
  { id: "bird_100", titleKey: "bird100", descKey: "bird100Desc", emoji: "🐦" },
  { id: "challenge_done", titleKey: "challengeDone", descKey: "challengeDoneDesc", emoji: "🏆" },
  { id: "duel_win", titleKey: "duelWin", descKey: "duelWinDesc", emoji: "⚔️" },
  { id: "league_gold", titleKey: "leagueGold", descKey: "leagueGoldDesc", emoji: "🥇" },
];

export function achievementById(id: string): AchievementDef | undefined {
  return ACHIEVEMENTS.find((a) => a.id === id);
}
