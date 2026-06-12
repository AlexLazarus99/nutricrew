import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "../api/client";
import { useMe } from "../hooks/useMe";

export function ProHubPage() {
  const { t } = useTranslation();
  const { me } = useMe();
  const [coachQ, setCoachQ] = useState("");
  const [coachA, setCoachA] = useState<string | null>(null);
  const [shopping, setShopping] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const isPro = me.pro?.isPro;

  async function askCoach() {
    setBusy(true);
    setError(null);
    try {
      const res = await api.proCoach(coachQ);
      setCoachA(res.answer);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function loadShopping() {
    setBusy(true);
    setError(null);
    try {
      const res = await api.getProShoppingList();
      setShopping(res.items);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (!isPro) {
    return (
      <section className="card stack">
        <h2>{t("pro.title")}</h2>
        <p className="muted">{t("pro.paywall")}</p>
        <Link to="/prizes" className="btn btn-primary">
          {t("pro.upgrade")}
        </Link>
      </section>
    );
  }

  return (
    <section className="stack">
      <div className="card hero">
        <h2>{t("pro.title")}</h2>
        <p className="muted">{t("pro.subtitle")}</p>
      </div>

      <div className="card stack">
        <h3>{t("pro.coach")}</h3>
        <textarea value={coachQ} onChange={(e) => setCoachQ(e.target.value)} rows={3} />
        <button type="button" className="btn btn-primary" disabled={busy} onClick={() => void askCoach()}>
          {t("pro.ask")}
        </button>
        {coachA && <p className="pro-coach-answer">{coachA}</p>}
      </div>

      <div className="card stack">
        <h3>{t("pro.shopping")}</h3>
        <button type="button" className="btn btn-secondary" disabled={busy} onClick={() => void loadShopping()}>
          {t("pro.generateList")}
        </button>
        {shopping.length > 0 && (
          <ul>
            {shopping.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        )}
      </div>

      <Link to="/report" className="btn btn-secondary btn-block">
        {t("pro.weeklyDigest")}
      </Link>

      {error && <p className="error">{error}</p>}
    </section>
  );
}
