import { useTranslation } from "react-i18next";

type Props = {
  mealsToday: number;
  target?: number;
};

export function DailyMealsProgress({ mealsToday, target = 3 }: Props) {
  const { t } = useTranslation();
  const pct = Math.min(100, Math.round((mealsToday / target) * 100));

  return (
    <div className="card daily-meals-card">
      <h3>{t("growth.dailyMealsTitle")}</h3>
      <p className="muted small">{t("growth.dailyMealsHint", { count: mealsToday, target })}</p>
      <div className="progress-bar daily-meals-bar">
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="daily-meal-dots" aria-hidden>
        {Array.from({ length: target }, (_, i) => (
          <span key={i} className={i < mealsToday ? "meal-dot filled" : "meal-dot"} />
        ))}
      </div>
    </div>
  );
}
