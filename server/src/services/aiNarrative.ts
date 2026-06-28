import type { DbUser } from "../types.js";

type WeeklyStats = {
  mealsLogged: number;
  daysLogged: number;
  calories: number;
  protein: number;
  points: number;
  streak: number;
  teamName: string | null;
  teamRank: number | null;
};

export function buildWeeklyNarrative(user: DbUser, stats: WeeklyStats): string {
  const ru = user.locale?.startsWith("ru");
  const parts: string[] = [];

  if (stats.mealsLogged === 0) {
    return ru
      ? "На этой неделе записей не было — начни с одного приёма пищи сегодня, и отчёт оживёт."
      : "No meals logged this week — start with one entry today to bring the report to life.";
  }

  parts.push(
    ru
      ? `За неделю ${stats.mealsLogged} приёмов пищи в ${stats.daysLogged} дн.`
      : `${stats.mealsLogged} meals across ${stats.daysLogged} days this week.`,
  );

  if (stats.streak >= 3) {
    parts.push(
      ru
        ? `Серия ${stats.streak} дн. — отличный темп.`
        : `${stats.streak}-day streak — strong momentum.`,
    );
  }

  if (stats.teamName && stats.teamRank != null) {
    parts.push(
      ru
        ? `Команда «${stats.teamName}» на ${stats.teamRank}-м месте.`
        : `Team ${stats.teamName} is #${stats.teamRank}.`,
    );
  }

  if (stats.points > 0) {
    parts.push(
      ru ? `Набрано ${stats.points} очков.` : `You earned ${stats.points} points.`,
    );
  }

  return parts.join(" ");
}

export function buildCoachAnswer(
  user: DbUser,
  question: string,
  mealsSummary: string,
  mealCount: number,
  trendInsightTexts: string[],
): string {
  const ru = user.locale?.startsWith("ru");
  const q = question.toLowerCase();

  if (!mealsSummary) {
    return ru
      ? "Пока мало данных за неделю — залогируй 2–3 приёма пищи, и я смогу дать персональный совет."
      : "Not enough meals this week — log 2–3 meals and I can personalize advice.";
  }

  const context = trendInsightTexts.length
    ? trendInsightTexts.join(" ")
    : ru
      ? "Баланс в целом стабильный."
      : "Overall balance looks steady.";

  if (/белк|protein|мяс|куриц|творог|яйц/i.test(q)) {
    return ru
      ? `По дневнику (${mealCount} приёмов): ${context} Для белка добавь 25–35 г к завтраку и 30–40 г к обеду — яйца, рыба, творог, индейка.`
      : `From your diary (${mealCount} meals): ${context} For protein, aim for 25–35g at breakfast and 30–40g at lunch — eggs, fish, cottage cheese, turkey.`;
  }

  if (/вод|water|пить/i.test(q)) {
    return ru
      ? `По дневнику (${mealCount} приёмов): ${context} Держи 1.8–2.3 л воды в день — стакан за 20 минут до еды помогает не переедать.`
      : `From your diary (${mealCount} meals): ${context} Target 1.8–2.3L water daily — a glass 20 minutes before meals helps portion control.`;
  }

  if (/вес|weight|похуд|дефицит|calori|калор/i.test(q)) {
    return ru
      ? `По дневнику (${mealCount} приёмов): ${context} Устойчивый дефицит 300–400 ккал/день обычно даёт ~0.3–0.5 кг в неделю — это оценка, не медсовет.`
      : `From your diary (${mealCount} meals): ${context} A steady 300–400 kcal daily deficit often yields ~0.3–0.5 kg/week — an estimate, not medical advice.`;
  }

  if (/перекус|snack|вечер|ужин|dinner/i.test(q)) {
    return ru
      ? `По дневнику (${mealCount} приёмов): ${context} На вечер выбирай белок + овощи: йогурт, салат с курицей, омлет — меньше быстрых углеводов перед сном.`
      : `From your diary (${mealCount} meals): ${context} For evenings, pick protein + veggies: yogurt, chicken salad, omelet — fewer fast carbs before bed.`;
  }

  return ru
    ? `На основе дневника (${mealCount} приёмов): ${context} По вопросу «${question.trim().slice(0, 120)}» — сфокусируйся на регулярных приёмах, белке в каждом и воде 2 л. Могу подсказать точнее по белку, воде или дефициту.`
    : `Based on your diary (${mealCount} meals): ${context} Re: "${question.trim().slice(0, 120)}" — focus on regular meals, protein each time, and ~2L water. Ask me about protein, water, or calorie deficit for specifics.`;
}
