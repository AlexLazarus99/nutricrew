import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "../api/client";
import { useMe } from "../hooks/useMe";
import { useAutoJoinTeam } from "../hooks/useAutoJoinTeam";
import { InviteShareButton } from "../components/InviteShareButton";
import { DailyMealsProgress } from "../components/DailyMealsProgress";
import { ProgressLevelCard } from "../components/ProgressLevelCard";
import { TutorialCoach } from "../components/TutorialCoach";
import { SocialLinks } from "../components/SocialLinks";
import { useTutorialTour } from "../hooks/useTutorialTour";
import { QuestsPanel } from "../components/QuestsPanel";
import type { GrowthSummary } from "../api/client";

const LEAGUE_TIER_EMOJI: Record<string, string> = {
  bronze: "🥉",
  silver: "🥈",
  gold: "🥇",
  platinum: "💠",
  diamond: "💎",
};

function GrowthFeaturesLink({ growth }: { growth: GrowthSummary }) {
  const { t } = useTranslation();
  const tier = growth.league.tier.toLowerCase();
  const tierKey = tier in LEAGUE_TIER_EMOJI ? tier : "bronze";
  const goalDone = growth.dailyGoal.done;
  const goalLabel = goalDone
    ? t("growth.dailyGoalDone")
    : t("growth.dailyGoalShort", {
        progress: growth.dailyGoal.progress,
        target: growth.dailyGoal.target,
      });

  return (
    <Link to="/features" className="card growth-hint-card">
      <div className="growth-hint-card__body">
        <span className="growth-hint-card__title">{t("growth.featuresCta")}</span>
        <div className="growth-hint-card__chips">
          <span className={`growth-hint-chip growth-hint-chip--league growth-hint-chip--${tierKey}`}>
            <span className="growth-hint-chip__emoji" aria-hidden>
              {LEAGUE_TIER_EMOJI[tierKey]}
            </span>
            {t(`features.leagueTiers.${tierKey}`)}
          </span>
          <span className={`growth-hint-chip growth-hint-chip--goal${goalDone ? " is-done" : ""}`}>
            {goalLabel}
          </span>
        </div>
      </div>
      <span className="growth-hint-card__chevron" aria-hidden>
        →
      </span>
    </Link>
  );
}

const TEAM_TEMPLATES = [
  { key: "friends", nameRu: "Друзья", nameEn: "Friends" },
  { key: "gym", nameRu: "Зал 💪", nameEn: "Gym Crew 💪" },
  { key: "office", nameRu: "Офис", nameEn: "Office" },
] as const;

export function HomePage() {
  const { t, i18n } = useTranslation();
  const { me, refresh } = useMe();
  const [error, setError] = useState<string | null>(null);
  const [teamName, setTeamName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [teamBusy, setTeamBusy] = useState(false);
  const [teamLeagueTag, setTeamLeagueTag] = useState<string | undefined>();

  useAutoJoinTeam(me, refresh);
  const welcomeTour = useTutorialTour("welcome", me.profileComplete);

  async function onCreateTeam(e: FormEvent) {
    e.preventDefault();
    setTeamBusy(true);
    setError(null);
    try {
      await api.createTeam(teamName, teamLeagueTag);
      await refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setTeamBusy(false);
    }
  }

  async function onJoinTeam(e: FormEvent) {
    e.preventDefault();
    setTeamBusy(true);
    setError(null);
    try {
      await api.joinTeam(joinCode.trim(), me.user.id);
      await refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setTeamBusy(false);
    }
  }

  function applyTemplate(template: (typeof TEAM_TEMPLATES)[number]) {
    const name = i18n.language.startsWith("ru") ? template.nameRu : template.nameEn;
    setTeamName(name);
    setTeamLeagueTag(template.key);
  }

  const displayName = me.user.firstName ?? "Crew";
  const prizeMembersNeeded = Math.max(0, me.minTeamForPrizes - me.teamMemberCount);

  if (!me.teamId) {
    return (
      <section className="stack">
        <TutorialCoach {...welcomeTour} />
        <ProgressLevelCard progress={me.progress} />
        <QuestsPanel
          key={`${me.todayPoints}-${me.progress.xp}-${me.starBalance}`}
          onClaimed={refresh}
        />
        {error && (
          <div className="card error-card">
            <p className="muted">{error}</p>
          </div>
        )}

        <div className="card hero">
          <h2>{t("home.greeting", { name: displayName })}</h2>
          <p className="muted">{t("home.noTeam")}</p>
          <p className="muted small">{t("growth.tryLogFirst")}</p>
        </div>

        <Link to="/log" className="btn btn-primary btn-block">
          {t("growth.logWithoutTeam")}
        </Link>

        <div className="card">
          <h3>{t("growth.teamTemplatesTitle")}</h3>
          <div className="team-template-row">
            {TEAM_TEMPLATES.map((tpl) => (
              <button
                key={tpl.key}
                type="button"
                className="btn btn-secondary team-template-btn"
                onClick={() => applyTemplate(tpl)}
              >
                {i18n.language.startsWith("ru") ? tpl.nameRu : tpl.nameEn}
              </button>
            ))}
          </div>
        </div>

        <form className="card form" onSubmit={onCreateTeam}>
          <h3>{t("home.createTeam")}</h3>
          <label>
            {t("home.teamName")}
            <input value={teamName} onChange={(e) => setTeamName(e.target.value)} required />
          </label>
          <button type="submit" className="btn btn-primary btn-block" disabled={teamBusy}>
            {t("home.createBtn")}
          </button>
        </form>

        <form className="card form" onSubmit={onJoinTeam}>
          <h3>{t("home.joinTeam")}</h3>
          <label>
            {t("home.inviteCode")}
            <input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder={me.startInviteCode ?? ""}
              required
            />
          </label>
          <button type="submit" className="btn btn-secondary btn-block" disabled={teamBusy}>
            {t("home.joinBtn")}
          </button>
        </form>

        {me.startInviteCode && (
          <p className="muted small">{t("growth.autoJoinPending", { code: me.startInviteCode })}</p>
        )}

        <Link to="/game" className="btn btn-secondary btn-block">
          🐦 {t("home.gameCta")}
        </Link>
        <Link to="/quiz" className="btn btn-secondary btn-block">
          🔥 {t("home.quizCta")}
        </Link>
        <SocialLinks links={me.socialLinks ?? {}} variant="card" />
      </section>
    );
  }

  return (
    <section className="stack">
      <TutorialCoach {...welcomeTour} />
      <ProgressLevelCard progress={me.progress} />
      <QuestsPanel
        key={`${me.todayPoints}-${me.progress.xp}-${me.starBalance}`}
        onClaimed={refresh}
      />
      <div className="card hero" data-tutorial="home-hero">
        <h2>{t("home.greeting", { name: displayName })}</h2>
        <p className="muted">{t("home.teamWaiting")}</p>
        {me.inviteCode && (
          <p className="invite">
            {t("home.shareCode")}: <code>{me.inviteCode}</code>
          </p>
        )}
      </div>

      <DailyMealsProgress
        mealsToday={me.mealsToday}
        target={me.growth?.dailyGoal?.type === "meals" ? me.growth.dailyGoal.target : me.mealsTodayTarget}
      />

      <Link to="/trends" className="btn btn-secondary btn-block">
        📈 {t("trends.title")}
      </Link>
      {me.pro?.isPro && (
        <Link to="/pro" className="btn btn-secondary btn-block">
          ✨ {t("pro.title")}
        </Link>
      )}

      {me.growth && (
        <GrowthFeaturesLink growth={me.growth} />
      )}

      {prizeMembersNeeded > 0 && (
        <div className="card growth-hint-card">
          <p className="muted small">
            {t("growth.prizePoolHint", {
              needed: prizeMembersNeeded,
              min: me.minTeamForPrizes,
            })}
          </p>
        </div>
      )}

      {(me.dailyBonus.game || me.dailyBonus.quiz) && (
        <p className="muted small">{t("growth.dailyBonusDone")}</p>
      )}
      {!me.dailyBonus.game && (
        <p className="muted small">{t("growth.dailyBonusGameHint")}</p>
      )}
      {!me.dailyBonus.quiz && (
        <p className="muted small">{t("growth.dailyBonusQuizHint")}</p>
      )}

      <div className="stats-row">
        <div className="stat">
          <span className="stat-value">{me.streak.days}</span>
          <span className="stat-label">{t("home.streak", { days: me.streak.days })}</span>
        </div>
        <div className="stat">
          <span className="stat-value">×{me.streak.multiplier.toFixed(2)}</span>
          <span className="stat-label">
            {t("home.multiplier", { value: me.streak.multiplier.toFixed(2) })}
          </span>
        </div>
        <div className="stat">
          <span className="stat-value">×{me.teamMultiplier.toFixed(2)}</span>
          <span className="stat-label">{t("home.teamMult")}</span>
        </div>
        <div className="stat">
          <span className="stat-value">{me.todayPoints}</span>
          <span className="stat-label">{t("home.todayPoints")}</span>
        </div>
      </div>

      {me.inviteCode && (
        <InviteShareButton
          inviteCode={me.inviteCode}
          botUsername={me.botUsername}
          inviteUrl={me.inviteUrl}
          referrerTelegramId={me.user.id}
        />
      )}

      <Link to="/log" className="btn btn-primary btn-block">
        {t("home.logCta")}
      </Link>
      <Link to="/guide" className="btn btn-secondary btn-block">
        🥗 {t("home.guideCta")}
      </Link>
      <Link to="/quiz" className="btn btn-secondary btn-block">
        🔥 {t("home.quizCta")}
      </Link>
      <Link to="/game" className="btn btn-secondary btn-block">
        🐦 {t("home.gameCta")}
      </Link>
      <Link to="/prizes" className="btn btn-secondary btn-block">
        ⭐ {t("nav.prizes")} ({me.starBalance})
      </Link>
      <SocialLinks links={me.socialLinks ?? {}} variant="card" />
    </section>
  );
}
