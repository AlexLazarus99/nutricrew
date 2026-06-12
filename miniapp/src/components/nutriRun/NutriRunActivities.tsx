import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { BirdGameLeaderboardEntry, BirdGameMetaResponse } from "../../api/client";

export type NutriRunLastRun = {
  score: number;
  flights: number;
  fruits: number;
  improved?: boolean;
};

type Props = {
  meta: BirdGameMetaResponse | null;
  leaderboard: BirdGameLeaderboardEntry[] | null;
  teamBonusDone: boolean;
  lastRun: NutriRunLastRun | null;
  claimBusy: boolean;
  onClaimDaily: () => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
};

export function NutriRunActivities({
  meta,
  leaderboard,
  teamBonusDone,
  lastRun,
  claimBusy,
  onClaimDaily,
  collapsed,
  onToggleCollapsed,
}: Props) {
  const { t } = useTranslation();
  const daily = meta?.daily;
  const dailyPct =
    daily && daily.target > 0 ? Math.min(100, Math.round((daily.best / daily.target) * 100)) : 0;

  return (
    <div className="nutrirun-activities card">
      <button
        type="button"
        className="nutrirun-activities__toggle"
        onClick={onToggleCollapsed}
        aria-expanded={!collapsed}
      >
        <span className="nutrirun-activities__toggle-title">{t("nutriRun.activities.title")}</span>
        <span className="muted small">{collapsed ? "▼" : "▲"}</span>
      </button>

      {!collapsed && (
        <div className="nutrirun-activities__body stack">
          {lastRun && (
            <p className="nutrirun-activities__toast small">
              {t("nutriRun.activities.lastRun", {
                score: lastRun.score,
                flights: lastRun.flights,
                fruits: lastRun.fruits,
              })}
              {lastRun.improved ? ` · ${t("nutriRun.activities.newBest")}` : ""}
            </p>
          )}

          {meta?.birdBoost.active && (
            <p className="nutrirun-activities__boost small">{t("nutriRun.activities.birdBoost")}</p>
          )}

          <div className="nutrirun-activities__daily">
            <div className="nutrirun-activities__daily-head">
              <strong>{t("nutriRun.activities.dailyTitle")}</strong>
              <span className="muted small">
                {daily ? `${daily.best} / ${daily.target}` : "—"}
              </span>
            </div>
            <div className="nutrirun-activities__bar" aria-hidden>
              <div className="nutrirun-activities__bar-fill" style={{ width: `${dailyPct}%` }} />
            </div>
            <p className="muted small">
              {t("nutriRun.activities.dailyHint", {
                target: daily?.target ?? 22,
                stars: daily?.rewardStars ?? 5,
              })}
            </p>
            {daily?.done && !daily.claimed && (
              <button type="button" className="btn btn-primary btn-block" disabled={claimBusy} onClick={onClaimDaily}>
                {t("nutriRun.activities.claimStars", { stars: daily.rewardStars })}
              </button>
            )}
            {daily?.claimed && (
              <p className="muted small">{t("nutriRun.activities.dailyClaimed")}</p>
            )}
          </div>

          <div className="nutrirun-activities__team">
            <span>{teamBonusDone ? "✅" : "🎯"}</span>
            <p className="small">
              {teamBonusDone
                ? t("nutriRun.activities.teamBonusDone")
                : t("nutriRun.activities.teamBonusHint")}
            </p>
          </div>

          <div className="nutrirun-activities__links">
            <Link to="/log" className="nutrirun-activities__link">
              <span aria-hidden>🥗</span>
              {t("nutriRun.activities.linkLog")}
            </Link>
            <Link to="/quiz" className="nutrirun-activities__link">
              <span aria-hidden>🧠</span>
              {t("nutriRun.activities.linkQuiz")}
            </Link>
            <Link to="/rank" className="nutrirun-activities__link">
              <span aria-hidden>🏆</span>
              {t("nutriRun.activities.linkRank")}
            </Link>
            <Link to="/guide" className="nutrirun-activities__link">
              <span aria-hidden>📖</span>
              {t("nutriRun.activities.linkGuide")}
            </Link>
          </div>

          <div className="nutrirun-activities__loop card">
            <h3>{t("nutriRun.activities.loopTitle")}</h3>
            <ol className="nutrirun-activities__steps muted small">
              <li>{t("nutriRun.activities.loopStep1")}</li>
              <li>{t("nutriRun.activities.loopStep2")}</li>
              <li>{t("nutriRun.activities.loopStep3")}</li>
            </ol>
          </div>

          {leaderboard && leaderboard.length > 0 && (
            <div className="nutrirun-activities__board">
              <h3>{t("nutriRun.activities.leaderboard")}</h3>
              <ul className="nutrirun-activities__board-list">
                {leaderboard.slice(0, 5).map((e) => (
                  <li key={`${e.rank}-${e.name}`} className={e.isYou ? "is-you" : ""}>
                    <span className="nutrirun-activities__rank">{e.rank}</span>
                    <span className="nutrirun-activities__name">{e.isYou ? t("nutriRun.activities.you") : e.name}</span>
                    <span className="nutrirun-activities__score">{e.score}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
