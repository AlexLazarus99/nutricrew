import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api, type TeamResponse } from "../api/client";
import { useMe } from "../hooks/useMe";
import { InviteShareButton } from "../components/InviteShareButton";
import { TeamActivityFeed } from "../components/TeamActivityFeed";
import { TutorialCoach } from "../components/TutorialCoach";
import { useTutorialTour } from "../hooks/useTutorialTour";
import { SkeletonCard } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/EmptyState";
import { NavBadgeIcon } from "../components/nav/NavBadgeIcon";

export function TeamPage() {
  const { t } = useTranslation();
  const { me } = useMe();
  const teamTour = useTutorialTour("team", true);
  const [team, setTeam] = useState<TeamResponse | null>(null);
  const [isCaptain, setIsCaptain] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recipes, setRecipes] = useState<Array<{ id: string; title: string; voteCount: number }>>([]);

  useEffect(() => {
    Promise.all([api.getTeam(), api.getGrowth()])
      .then(async ([teamData, growth]) => {
        setTeam(teamData);
        setIsCaptain(growth.teamRole === "captain");
        try {
          const r = await api.getTeamRecipes(teamData.id);
          setRecipes(r.recipes);
        } catch {
          /* optional */
        }
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  if (error) {
    return (
      <EmptyState
        title={t("common.error")}
        hint={error}
        icon={<NavBadgeIcon kind="team" size={44} />}
        actionLabel={t("common.backHome")}
        actionTo="/"
      />
    );
  }
  if (!team) {
    return (
      <section className="stack">
        <SkeletonCard />
        <SkeletonCard />
      </section>
    );
  }

  const goal = team.weeklyGoal;
  const prizeMembersNeeded = Math.max(0, me.minTeamForPrizes - team.members.length);

  return (
    <section className="stack">
      <TutorialCoach {...teamTour} />
      <div className="card" data-tutorial="team-invite">
        <h2>
          {team.name}
          {team.isPremium && <span className="badge premium"> Premium</span>}
        </h2>
        <p className="invite">
          {t("team.invite")}: <code>{team.inviteCode}</code>
        </p>
        {prizeMembersNeeded > 0 && (
          <p className="muted small">
            {t("growth.prizePoolHint", {
              needed: prizeMembersNeeded,
              min: me.minTeamForPrizes,
            })}
          </p>
        )}
        <InviteShareButton
          inviteCode={team.inviteCode}
          botUsername={me.botUsername}
          inviteUrl={me.inviteUrl}
          referrerTelegramId={me.user.id}
          variant="secondary"
        />
        <Link to="/chat" className="btn btn-secondary btn-block chat-team-cta">
          💬 {t("chat.openFromTeam")}
        </Link>
        {isCaptain && (
          <Link to="/team/admin" className="btn btn-primary btn-block">
            📊 {t("teamAdmin.open")}
          </Link>
        )}
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

      <Link to="/features" className="btn btn-secondary btn-block">
        {t("nav.features")}
      </Link>
      <TeamActivityFeed />

      {recipes.length > 0 && (
        <div className="card">
          <h3>{t("team.recipesTitle", { defaultValue: "Team recipes" })}</h3>
          <ul className="member-list">
            {recipes.map((r) => (
              <li key={r.id} className="member">
                <span>{r.title}</span>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => void api.voteTeamRecipe(r.id).then(() => {
                    setRecipes((prev) =>
                      prev.map((x) => (x.id === r.id ? { ...x, voteCount: x.voteCount + 1 } : x)),
                    );
                  })}
                >
                  👍 {r.voteCount}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

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
