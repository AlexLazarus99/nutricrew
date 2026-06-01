import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { api, type TeamResponse } from "../api/client";

export function TeamPage() {
  const { t } = useTranslation();
  const [team, setTeam] = useState<TeamResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getTeam()
      .then(setTeam)
      .catch((e: Error) => setError(e.message));
  }, []);

  if (error) {
    return (
      <section className="card">
        <p>{error}</p>
        <p className="muted">{t("team.needTeam")}</p>
      </section>
    );
  }
  if (!team) {
    return <p className="loading">{t("common.loading")}</p>;
  }

  const goal = team.weeklyGoal;

  return (
    <section className="stack">
      <div className="card">
        <h2>
          {team.name}
          {team.isPremium && <span className="badge premium"> Premium</span>}
        </h2>
        <p className="invite">
          {t("team.invite")}: <code>{team.inviteCode}</code>
        </p>
        <p className="muted">
          {t("team.weeklyGoal", { type: goal.type })} —{" "}
          {t("team.progress", {
            current: goal.current,
            target: goal.target,
            unit: goal.unit,
          })}
        </p>
        <p>{t("team.rank", { rank: team.rank, total: team.totalTeams })}</p>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${Math.min(100, (goal.current / goal.target) * 100)}%` }}
          />
        </div>
      </div>

      <ul className="member-list">
        {team.members.map((m) => (
          <li key={m.id} className="card member">
            <span className="member-name">{m.name}</span>
            <span className="member-points">{m.points}</span>
            <span className={m.loggedToday ? "badge ok" : "badge warn"}>
              {m.loggedToday ? t("team.loggedToday") : t("team.notLogged")}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
