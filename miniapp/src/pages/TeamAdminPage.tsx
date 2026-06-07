import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api, type TeamAdminResponse } from "../api/client";
import { trackEvent } from "../lib/analytics";

export function TeamAdminPage() {
  const { t } = useTranslation();
  const [data, setData] = useState<TeamAdminResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    trackEvent("team_admin_view");
    api
      .getTeamAdmin()
      .then(setData)
      .catch((e: Error) => setError(e.message));
  }, []);

  if (error) {
    return (
      <section className="card">
        <p className="error">{error}</p>
        <Link to="/team" className="btn btn-secondary">
          {t("teamAdmin.back")}
        </Link>
      </section>
    );
  }

  if (!data) {
    return <p className="loading">{t("common.loading")}</p>;
  }

  return (
    <section className="stack">
      <div className="card hero">
        <h2>{t("teamAdmin.title")}</h2>
        <p>{data.team.name}</p>
        <p className="muted">
          {t("teamAdmin.participation", {
            logged: data.membersLoggedToday,
            total: data.membersTotal,
            rate: data.participationRate,
          })}
        </p>
        <p className="stat-value">{data.weekPoints} {t("teamAdmin.weekPts")}</p>
      </div>

      <div className="card">
        <h3>{t("teamAdmin.members")}</h3>
        <ul className="admin-member-list">
          {data.members.map((m) => (
            <li key={m.telegramId} className="admin-member-row">
              <div>
                <strong>{m.firstName}</strong>
                {m.role === "captain" && <span className="badge">👑</span>}
              </div>
              <span className="muted small">
                {t("teamAdmin.memberStats", {
                  today: m.mealsToday,
                  week: m.mealsThisWeek,
                  pts: m.weekPoints,
                })}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <Link to="/team" className="btn btn-secondary btn-block">
        {t("teamAdmin.back")}
      </Link>
    </section>
  );
}
