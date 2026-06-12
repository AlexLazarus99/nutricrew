import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api, type GrowthPayload } from "../api/client";
import { useMe } from "../hooks/useMe";
import "../styles/features.css";
import { AchievementBadgeIcon } from "../components/AchievementBadgeIcon";
import { ChallengeIcon } from "../components/QuestIcon";
import { ProgressLevelCard } from "../components/ProgressLevelCard";
import { LeagueTierBadge } from "../components/LeagueTierBadge";

export function FeaturesPage() {
  const { t } = useTranslation();
  const { me, refresh } = useMe();
  const [growth, setGrowth] = useState<GrowthPayload | null>(null);
  const [loadingGrowth, setLoadingGrowth] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const reloadGrowth = useCallback(async () => {
    const data = await api.getGrowth();
    setGrowth(data);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoadingGrowth(true);
    void reloadGrowth()
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoadingGrowth(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadGrowth]);

  const run = useCallback(
    async (key: string, fn: () => Promise<unknown>) => {
      setBusy(key);
      setMsg(null);
      try {
        await fn();
        await Promise.all([refresh(), reloadGrowth()]);
      } catch (e) {
        setMsg((e as Error).message);
      } finally {
        setBusy(null);
      }
    },
    [refresh, reloadGrowth],
  );

  if (loadingGrowth || !growth) {
    return (
      <section className="stack features-page">
        <ProgressLevelCard progress={me.progress} compact />
        <div className="card features-loading">
          <p className="muted">{t("features.loading")}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="stack features-page features-grid">
      <ProgressLevelCard progress={me.progress} compact />
      <div className="card hero features-hero">
        <h2>{t("features.title")}</h2>
        <p className="muted small">{t("features.subtitle")}</p>
      </div>

      {msg && (
        <div className="card error-card">
          <p className="muted small">{msg}</p>
        </div>
      )}

      <DailyGoalCard growth={growth} busy={busy} run={run} />
      <LeagueCard growth={growth} />
      <StreakFreezeCard growth={growth} busy={busy} run={run} starBalance={me.starBalance} />
      <DoublePointsCard growth={growth} busy={busy} run={run} />
      <BirdBoostCard growth={growth} />
      {growth.challenge && <ChallengeCard growth={growth} />}
      {me.teamId && <DuelCard growth={growth} busy={busy} run={run} />}
      <BattlePassCard growth={growth} />
      <AchievementsCard growth={growth} />
      <PrivacyCard growth={growth} busy={busy} run={run} />
      {growth.corpLeaderboard.length > 0 && (
        <CorpLeaderboardCard items={growth.corpLeaderboard} />
      )}
      <ToolsCard />
    </section>
  );
}

function DailyGoalCard({
  growth,
  busy,
  run,
}: {
  growth: GrowthPayload;
  busy: string | null;
  run: (k: string, fn: () => Promise<unknown>) => void;
}) {
  const { t } = useTranslation();
  const types = ["meals", "points", "protein", "calories"] as const;
  return (
    <div className="card feature-card">
      <h3>{t("features.dailyGoalTitle")}</h3>
      <p className="muted small">
        {t("features.dailyGoalProgress", {
          progress: growth.dailyGoal.progress,
          target: growth.dailyGoal.target,
        })}
      </p>
      <div className="feature-row">
        {types.map((type) => (
          <button
            key={type}
            type="button"
            className={`feature-chip ${growth.dailyGoal.type === type ? "active" : ""}`}
            disabled={busy !== null}
            onClick={() =>
              run(`goal-${type}`, () =>
                api.patchGrowthSettings({
                  dailyGoalType: type,
                  dailyGoalTarget:
                    type === "protein"
                      ? 80
                      : type === "points"
                        ? 50
                        : type === "calories"
                          ? 2000
                          : 3,
                }),
              )
            }
          >
            {t(`features.goal_${type}`)}
          </button>
        ))}
      </div>
    </div>
  );
}

function LeagueCard({ growth }: { growth: GrowthPayload }) {
  const { t } = useTranslation();
  return (
    <div className="card feature-card feature-card--league">
      <h3>{t("features.leagueTitle")}</h3>
      <LeagueTierBadge
        tier={growth.league.tier}
        weeklyXp={growth.league.weeklyXp}
        xpToNext={growth.league.xpToNext}
      />
      {growth.league.xpToNext <= 0 && (
        <p className="muted small features-league-max">{t("features.leagueMax")}</p>
      )}
    </div>
  );
}

function StreakFreezeCard({
  growth,
  busy,
  run,
  starBalance,
}: {
  growth: GrowthPayload;
  busy: string | null;
  run: (k: string, fn: () => Promise<unknown>) => void;
  starBalance: number;
}) {
  const { t } = useTranslation();
  return (
    <div className="card feature-card">
      <h3>{t("features.freezeTitle")}</h3>
      <p className="muted small">{t("features.freezeCount", { count: growth.streakFreezes })}</p>
      <div className="feature-row">
        <button
          type="button"
          className="btn btn-secondary"
          disabled={busy !== null || growth.streakFreezes < 1}
          onClick={() => run("freeze-use", () => api.useStreakFreeze())}
        >
          {t("features.freezeUse")}
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          disabled={busy !== null || starBalance < 15}
          onClick={() => run("freeze-buy", () => api.buyStreakFreeze(true))}
        >
          {t("features.freezeBuy")}
        </button>
      </div>
    </div>
  );
}

function DoublePointsCard({
  growth,
  busy,
  run,
}: {
  growth: GrowthPayload;
  busy: string | null;
  run: (k: string, fn: () => Promise<unknown>) => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="card feature-card">
      <h3>{t("features.doubleTitle")}</h3>
      <p className="muted small">{t("features.doubleHint")}</p>
      <button
        type="button"
        className="btn btn-primary"
        disabled={busy !== null || !growth.doublePoints.available}
        onClick={() => run("double", () => api.activateDoublePoints())}
      >
        {growth.doublePoints.available ? t("features.doubleActivate") : t("features.doubleUsed")}
      </button>
    </div>
  );
}

function BirdBoostCard({ growth }: { growth: GrowthPayload }) {
  const { t } = useTranslation();
  return (
    <div className="card feature-card">
      <h3>{t("features.birdBoostTitle")}</h3>
      <p className="muted small">
        {growth.birdBoost.active
          ? t("features.birdBoostActive")
          : t("features.birdBoostHint")}
      </p>
      <Link to="/game" className="btn btn-secondary btn-block">
        {t("nav.game")}
      </Link>
    </div>
  );
}

function ChallengeCard({ growth }: { growth: GrowthPayload }) {
  const { t } = useTranslation();
  const ch = growth.challenge!;
  return (
    <div className="card feature-card challenge-card">
      <div className="challenge-card-head">
        <ChallengeIcon
          challengeId={ch.id}
          completed={ch.completed}
          progress={ch.progress}
          target={ch.target}
          size={58}
        />
        <h3>{t(`features.challenges.${ch.titleKey}`)}</h3>
      </div>
      <p className="muted small">{t(`features.challenges.${ch.descKey}`)}</p>
      <div className="daily-meals-bar">
        <div
          className="daily-meals-fill"
          style={{ width: `${Math.min(100, (ch.progress / ch.target) * 100)}%` }}
        />
      </div>
      <p className="small">
        {ch.progress}/{ch.target}
        {ch.completed ? ` · ${t("features.challengeDone")}` : ""}
      </p>
    </div>
  );
}

function DuelCard({
  growth,
  busy,
  run,
}: {
  growth: GrowthPayload;
  busy: string | null;
  run: (k: string, fn: () => Promise<unknown>) => void;
}) {
  const { t } = useTranslation();
  const d = growth.duel;
  return (
    <div className="card feature-card">
      <h3>{t("features.duelTitle")}</h3>
      {d ? (
        <p className="muted small">
          {t("features.duelScore", {
            you: d.yourPoints,
            foe: d.foePoints,
            name: d.foeName,
          })}
        </p>
      ) : (
        <p className="muted small">{t("features.duelEmpty")}</p>
      )}
      {!d && (
        <button
          type="button"
          className="btn btn-secondary"
          disabled={busy !== null}
          onClick={() => run("duel", () => api.startDuel())}
        >
          {t("features.duelStart")}
        </button>
      )}
    </div>
  );
}

function BattlePassCard({ growth }: { growth: GrowthPayload }) {
  const { t } = useTranslation();
  const bp = growth.battlePass;
  const pct = Math.min(100, (bp.xp / bp.xpPerTier) * 100);
  return (
    <div className="card feature-card">
      <h3>{t("features.passTitle")}</h3>
      <p className="muted small">
        {t("features.passTier", { tier: bp.tier, max: bp.maxTier })}
      </p>
      <div className="battle-pass-bar">
        <div className="battle-pass-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function AchievementsCard({ growth }: { growth: GrowthPayload }) {
  const { t } = useTranslation();
  return (
    <div className="card feature-card achievement-card">
      <h3>{t("features.achievementsTitle")}</h3>
      <div className="achievement-grid">
        {growth.achievements.map((a) => (
          <div
            key={a.id}
            className={`achievement-tile ${a.unlocked ? "unlocked achievement-tile--unlocked" : ""}`}
          >
            <div className="achievement-tile__badge-wrap">
              <AchievementBadgeIcon achievementId={a.id} unlocked={a.unlocked} size={132} />
            </div>
            <p className="achievement-tile__title">{t(`features.achievements.${a.titleKey}`)}</p>
            <p className="achievement-tile__desc muted">{t(`features.achievements.${a.descKey}`)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function PrivacyCard({
  growth,
  busy,
  run,
}: {
  growth: GrowthPayload;
  busy: string | null;
  run: (k: string, fn: () => Promise<unknown>) => void;
}) {
  const { t } = useTranslation();
  const opts = ["team", "private", "hidden"] as const;
  return (
    <div className="card feature-card">
      <h3>{t("features.privacyTitle")}</h3>
      <div className="feature-row">
        {opts.map((p) => (
          <button
            key={p}
            type="button"
            className={`feature-chip ${growth.photoPrivacy === p ? "active" : ""}`}
            disabled={busy !== null}
            onClick={() => run(`privacy-${p}`, () => api.patchGrowthSettings({ photoPrivacy: p }))}
          >
            {t(`features.privacy_${p}`)}
          </button>
        ))}
      </div>
    </div>
  );
}

function CorpLeaderboardCard({
  items,
}: {
  items: GrowthPayload["corpLeaderboard"];
}) {
  const { t } = useTranslation();
  return (
    <div className="card feature-card">
      <h3>{t("features.corpTitle")}</h3>
      <ol className="team-activity-list">
        {items.map((row) => (
          <li key={row.rank}>
            #{row.rank} {row.name} — {row.points}
          </li>
        ))}
      </ol>
    </div>
  );
}

function ToolsCard() {
  const { t } = useTranslation();
  return (
    <div className="card feature-card">
      <h3>{t("features.toolsTitle")}</h3>
      <p className="muted small">{t("features.toolsHint")}</p>
      <Link to="/log" className="btn btn-secondary btn-block">
        {t("features.toolsLog")}
      </Link>
      <Link to="/quiz" className="btn btn-secondary btn-block">
        {t("nav.quiz")}
      </Link>
    </div>
  );
}
