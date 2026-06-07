import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { api, type WeeklyReportResponse } from "../api/client";
import { trackEvent } from "../lib/analytics";

export function WeeklyReportPage() {
  const { t } = useTranslation();
  const [report, setReport] = useState<WeeklyReportResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    trackEvent("weekly_report_view");
    api
      .getWeeklyReport()
      .then(setReport)
      .catch((e: Error) => setError(e.message));
  }, []);

  if (error) {
    return (
      <section className="card">
        <p className="error">{error}</p>
      </section>
    );
  }

  if (!report) {
    return <p className="loading">{t("common.loading")}</p>;
  }

  return (
    <section className="stack">
      <div className="card hero">
        <h2>{t("report.title")}</h2>
        <p className="muted">{report.weekKey}</p>
      </div>

      <div className="card report-grid">
        <div>
          <span className="muted small">{t("report.meals")}</span>
          <p className="stat-value">{report.mealsLogged}</p>
        </div>
        <div>
          <span className="muted small">{t("report.days")}</span>
          <p className="stat-value">{report.daysLogged}</p>
        </div>
        <div>
          <span className="muted small">{t("report.calories")}</span>
          <p className="stat-value">{report.calories}</p>
        </div>
        <div>
          <span className="muted small">{t("report.protein")}</span>
          <p className="stat-value">{report.protein}g</p>
        </div>
        <div>
          <span className="muted small">{t("report.points")}</span>
          <p className="stat-value">{report.points}</p>
        </div>
        <div>
          <span className="muted small">{t("report.streak")}</span>
          <p className="stat-value">{report.streak}</p>
        </div>
      </div>

      {report.teamName && (
        <div className="card">
          <h3>{t("report.teamBlock")}</h3>
          <p>
            {report.teamName}
            {report.teamRank != null && (
              <> · {t("report.teamRank", { rank: report.teamRank, points: report.teamPoints ?? 0 })}</>
            )}
          </p>
          <p className="muted small">
            {t("report.avgCalories", { value: report.avgCaloriesPerMeal })}
          </p>
        </div>
      )}
    </section>
  );
}
