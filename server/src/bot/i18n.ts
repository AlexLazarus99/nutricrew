export type BotLocale = "en" | "ru";

const messages = {
  en: {
    welcome: (name: string) =>
      `Hey ${name}! 👋\n\nWelcome to *NutriCrew* — turn meals into team points.\n\nOpen the app to log food, join your crew, and win weekly battles.`,
    openApp: "Open NutriCrew",
    help:
      "Commands:\n/start — open app\n/team — team stats\n/stars — balance & prizes\n/create <name> — new team\n/join <code> — join\n/lang en | ru",
    teamInfo: (name: string, rank: number, points: number, code: string) =>
      `Team *${name}*\nInvite code: \`${code}\`\nWeekly rank: #${rank}\nPoints: ${points}`,
    noTeam: "You're not in a team yet. Use /create <name> or /join <code>",
    langSet: (lang: BotLocale) => `Language set to ${lang === "ru" ? "Русский" : "English"}.`,
    langUsage: "Usage: /lang en or /lang ru",
    teamCreated: (name: string, code: string) =>
      `Team *${name}* created!\nShare code: \`${code}\`\nFriends join with /join ${code}`,
    teamJoined: (name: string) => `You joined *${name}*! Let's eat 🥗`,
    teamNotFound: "Team not found. Check the invite code.",
    alreadyInTeam: "You're already in a team. Leave is not in MVP yet.",
    createUsage: "Usage: /create Team Name",
    joinUsage: "Usage: /join INVITECODE",
    reminderBreakfast: "☀️ Your crew is waiting — log breakfast and keep the team multiplier!",
    reminderBehind: (team: string, diff: number) =>
      `⏰ You're behind *${team}* by ${diff} points today. Snap your meal!`,
  },
  ru: {
    welcome: (name: string) =>
      `Привет, ${name}! 👋\n\nДобро пожаловать в *NutriCrew* — превращай приёмы пищи в очки команды.\n\nОткрой приложение, чтобы логировать еду и выигрывать недельные битвы.`,
    openApp: "Открыть NutriCrew",
    help:
      "Команды:\n/start — приложение\n/team — статистика\n/stars — баланс и призы\n/create <имя> — создать\n/join <код> — вступить\n/lang en | ru",
    teamInfo: (name: string, rank: number, points: number, code: string) =>
      `Команда *${name}*\nКод: \`${code}\`\nРейтинг недели: #${rank}\nОчки: ${points}`,
    noTeam: "Ты ещё не в команде. /create <имя> или /join <код>",
    langSet: (lang: BotLocale) => `Язык: ${lang === "ru" ? "Русский" : "English"}.`,
    langUsage: "Использование: /lang en или /lang ru",
    teamCreated: (name: string, code: string) =>
      `Команда *${name}* создана!\nКод: \`${code}\`\nДрузья: /join ${code}`,
    teamJoined: (name: string) => `Ты в команде *${name}*! Поехали 🥗`,
    teamNotFound: "Команда не найдена. Проверь код.",
    alreadyInTeam: "Ты уже в команде.",
    createUsage: "Использование: /create Название",
    joinUsage: "Использование: /join КОД",
    reminderBreakfast:
      "☀️ Команда ждёт — залогируй завтрак и сохрани множитель!",
    reminderBehind: (team: string, diff: number) =>
      `⏰ Ты отстаёшь от *${team}* на ${diff} очков. Сфотографируй еду!`,
  },
} as const;

export function resolveBotLocale(languageCode?: string): BotLocale {
  if (languageCode?.toLowerCase().startsWith("ru")) return "ru";
  return "en";
}

export function t(locale: BotLocale) {
  return messages[locale];
}
