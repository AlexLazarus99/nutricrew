import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { api, type PrizesResponse } from "../api/client";

export function PrizesPage() {
  const { t } = useTranslation();
  const [data, setData] = useState<PrizesResponse | null>(null);
  const [fundStars, setFundStars] = useState("50");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api
      .getPrizes()
      .then(setData)
      .catch((e: Error) => setError(e.message));
  }, []);

  async function openInvoice(createLink: () => Promise<{ invoiceLink: string }>) {
    setBusy(true);
    setError(null);
    try {
      const { invoiceLink } = await createLink();
      const tg = window.Telegram?.WebApp;
      if (tg && "openInvoice" in tg) {
        (tg as { openInvoice: (url: string) => void }).openInvoice(invoiceLink);
      } else {
        window.open(invoiceLink, "_blank");
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (error && !data) {
    return (
      <section className="card">
        <p>{error}</p>
        <p className="muted">{t("prizes.needTeam")}</p>
      </section>
    );
  }

  if (!data) {
    return <p className="loading">{t("common.loading")}</p>;
  }

  return (
    <section className="stack">
      <div className="card hero">
        <h2>{t("prizes.title")}</h2>
        <p className="stat-value stars">⭐ {data.starBalance}</p>
        <p className="muted">{t("prizes.balanceHint")}</p>
      </div>

      {data.pool && (
        <div className="card">
          <h3>{t("prizes.poolTitle")}</h3>
          <p>
            {t("prizes.poolTotal", {
              total: data.pool.starsTotal,
              available: data.pool.starsAvailable,
            })}
          </p>
          <p className="muted">{t("prizes.poolHint")}</p>
          <label>
            {t("prizes.fundAmount")}
            <input
              type="number"
              value={fundStars}
              onChange={(e) => setFundStars(e.target.value)}
              min={10}
              max={1000}
            />
          </label>
          <button
            type="button"
            className="btn btn-primary btn-block"
            disabled={busy}
            onClick={() =>
              openInvoice(() => api.createFundInvoice(Number(fundStars) || 50))
            }
          >
            {t("prizes.fundBtn")}
          </button>
        </div>
      )}

      <div className="card">
        <h3>{t("prizes.premiumTitle")}</h3>
        {data.teamPremium ? (
          <p className="success">{t("prizes.premiumActive")}</p>
        ) : (
          <>
            <p className="muted">
              {t("prizes.premiumHint", { price: data.premiumPrice })}
            </p>
            <button
              type="button"
              className="btn btn-secondary btn-block"
              disabled={busy}
              onClick={() => openInvoice(() => api.createPremiumInvoice())}
            >
              {t("prizes.premiumBtn", { price: data.premiumPrice })}
            </button>
          </>
        )}
      </div>

      {data.awards.length > 0 && (
        <div className="card">
          <h3>{t("prizes.history")}</h3>
          <ul className="award-list">
            {data.awards.map((a, i) => (
              <li key={`${a.weekKey}-${i}`}>
                <span>{a.weekKey}</span>
                <span>+{a.stars} ⭐</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {error && <p className="error">{error}</p>}
    </section>
  );
}
