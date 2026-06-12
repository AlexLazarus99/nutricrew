import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api, type OrgDashboardResponse } from "../api/client";

export function OrgAdminPage() {
  const { t } = useTranslation();
  const [orgId, setOrgId] = useState("");
  const [orgName, setOrgName] = useState("");
  const [data, setData] = useState<OrgDashboardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("nutricrew_org_id");
    if (saved) setOrgId(saved);
  }, []);

  async function createOrg(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await api.createOrganization(orgName);
      setOrgId(res.organization.id);
      localStorage.setItem("nutricrew_org_id", res.organization.id);
      const dash = await api.getOrgDashboard(res.organization.id);
      setData(dash);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function loadDashboard() {
    if (!orgId) return;
    setBusy(true);
    setError(null);
    try {
      setData(await api.getOrgDashboard(orgId));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (orgId) void loadDashboard();
  }, [orgId]);

  return (
    <section className="stack">
      <div className="card hero">
        <h2>{t("org.title")}</h2>
        <p className="muted">{t("org.subtitle")}</p>
      </div>

      {!orgId && (
        <form className="card stack" onSubmit={(e) => void createOrg(e)}>
          <label>
            {t("org.name")}
            <input value={orgName} onChange={(e) => setOrgName(e.target.value)} required />
          </label>
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {t("org.create")}
          </button>
        </form>
      )}

      {error && <p className="error">{error}</p>}

      {data && (
        <>
          <div className="card">
            <h3>{data.organization.name}</h3>
            <p className="muted">
              {t("org.week")}: {data.weekKey} · {t("org.members")}: {data.totals.members}
            </p>
            <p className="stat-value">{data.totals.avgParticipation}% {t("org.participation")}</p>
          </div>
          {data.teams.map((team) => (
            <div key={team.id} className="card">
              <strong>{team.name}</strong>
              <p className="muted small">
                {team.loggedToday}/{team.members} {t("org.loggedToday")} · {team.weekPoints} pts
              </p>
            </div>
          ))}
        </>
      )}

      <Link to="/team/admin" className="btn btn-secondary btn-block">
        {t("teamAdmin.back")}
      </Link>
    </section>
  );
}
