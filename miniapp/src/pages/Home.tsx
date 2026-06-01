import { FormEvent, useState } from "react";

import { Link } from "react-router-dom";

import { useTranslation } from "react-i18next";

import { api } from "../api/client";

import { useMe } from "../hooks/useMe";



export function HomePage() {

  const { t } = useTranslation();

  const { me, refresh } = useMe();

  const [error, setError] = useState<string | null>(null);

  const [teamName, setTeamName] = useState("");

  const [joinCode, setJoinCode] = useState("");

  const [teamBusy, setTeamBusy] = useState(false);



  async function onCreateTeam(e: FormEvent) {

    e.preventDefault();

    setTeamBusy(true);

    setError(null);

    try {

      await api.createTeam(teamName);

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

      await api.joinTeam(joinCode);

      await refresh();

    } catch (err) {

      setError((err as Error).message);

    } finally {

      setTeamBusy(false);

    }

  }



  const displayName = me.user.firstName ?? "Crew";



  if (!me.teamId) {

    return (

      <section className="stack">

        {error && (

          <div className="card error-card">

            <p className="muted">{error}</p>

          </div>

        )}

        <div className="card hero">

          <h2>{t("home.greeting", { name: displayName })}</h2>

          <p className="muted">{t("home.noTeam")}</p>

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

            <input value={joinCode} onChange={(e) => setJoinCode(e.target.value)} required />

          </label>

          <button type="submit" className="btn btn-secondary btn-block" disabled={teamBusy}>

            {t("home.joinBtn")}

          </button>

        </form>

        <Link to="/game" className="btn btn-secondary btn-block">
          🐦 {t("home.gameCta")}
        </Link>

        <Link to="/quiz" className="btn btn-secondary btn-block">
          🔥 {t("home.quizCta")}
        </Link>

      </section>

    );

  }



  return (

    <section className="stack">

      <div className="card hero">

        <h2>{t("home.greeting", { name: displayName })}</h2>

        <p className="muted">{t("home.teamWaiting")}</p>

        {me.inviteCode && (

          <p className="invite">

            {t("home.shareCode")}: <code>{me.inviteCode}</code>

          </p>

        )}

      </div>



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



      <Link to="/log" className="btn btn-primary btn-block">

        {t("home.logCta")}

      </Link>

      <Link to="/guide" className="btn btn-secondary btn-block">

        🥗 {t("home.guideCta")}

      </Link>

      <Link to="/game" className="btn btn-secondary btn-block">

        🐦 {t("home.gameCta")}

      </Link>

      <Link to="/quiz" className="btn btn-secondary btn-block">

        🔥 {t("home.quizCta")}

      </Link>

      <Link to="/prizes" className="btn btn-secondary btn-block">

        ⭐ {t("nav.prizes")} ({me.starBalance})

      </Link>

    </section>

  );

}

