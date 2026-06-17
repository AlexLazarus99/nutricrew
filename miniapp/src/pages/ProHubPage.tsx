import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "../api/client";
import { useMe } from "../hooks/useMe";
import { ProTributeCheckout } from "../components/pro/ProTributeCheckout";

const PRO_FEATURES = [
  "pro.featureCoach",
  "pro.featureAi",
  "pro.featureReports",
  "pro.featureShopping",
  "pro.featureFreeze",
] as const;

function formatProUntil(iso: string | null | undefined, locale: string) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString(locale.startsWith("ru") ? "ru-RU" : "en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function ProHubPage() {
  const { t, i18n } = useTranslation();
  const { me } = useMe();
  const [shopping, setShopping] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const isPro = me.pro?.isPro;
  const proUntilLabel = formatProUntil(me.pro?.proUntil, i18n.language);

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
      <section className="stack pro-paywall-page">
        <div className="card pro-card pro-paywall">
          <p className="pro-paywall__badge">⭐ Pro</p>
          <h2>{t("pro.paywallHeadline")}</h2>
          <p className="pro-paywall__lead">{t("pro.paywallLead")}</p>

          <ul className="pro-paywall__features">
            {PRO_FEATURES.map((key) => (
              <li key={key}>{t(key)}</li>
            ))}
          </ul>

          <p className="pro-paywall__price">{t("pro.priceLine")}</p>

          <ProTributeCheckout source="pro_hub" />

          <p className="pro-paywall__stars muted small">{t("pro.tributeHint")}</p>
        </div>

        {error && <p className="error">{error}</p>}
      </section>
    );
  }

  return (
    <section className="stack">
      <div className="card hero pro-hub-hero">
        <h2>{t("pro.title")}</h2>
        <p className="muted">{t("pro.subtitle")}</p>
        {proUntilLabel && (
          <p className="pro-hub-hero__until success small">{t("pro.activeUntil", { date: proUntilLabel })}</p>
        )}
      </div>

      <Link to="/coach" className="btn btn-primary btn-block">
        {t("coach.title")} →
      </Link>

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
