import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { api, type LeaderboardResponse } from "../api/client";

export function LeaderboardPage() {
  const { t } = useTranslation();
  const [data, setData] = useState<LeaderboardResponse | null>(null);

  useEffect(() => {
    void api.getLeaderboard().then(setData);
  }, []);

  if (!data) {
    return <p className="loading">{t("common.loading")}</p>;
  }

  return (
    <section className="stack">
      <div className="card">
        <h2>{t("leaderboard.title")}</h2>
        <p className="muted">{t("leaderboard.week", { week: data.week })}</p>
      </div>

      <ol className="leaderboard">
        {data.teams.map((team) => (
          <li key={team.rank} className={`card rank rank-${team.rank}`}>
            <span className="rank-num">#{team.rank}</span>
            <span className="rank-name">{team.name}</span>
            <span className="rank-points">
              {t("leaderboard.points", { points: team.points })}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
