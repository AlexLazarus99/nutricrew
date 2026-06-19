import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMe } from "../../hooks/useMe";
import { resolveTributeProUrls } from "../../lib/tributeProUrls";
import { openTelegramInvoice } from "../../lib/openTelegramInvoice";
import { api } from "../../api/client";
import { ProTributeButton } from "./ProTributeButton";
import { ProSubscribeButton } from "./ProSubscribeButton";

type Props = {
  source: string;
};

type BillingPeriod = "monthly" | "yearly";

export function ProTributeCheckout({ source }: Props) {
  const { t } = useTranslation();
  const { me } = useMe();
  const [period, setPeriod] = useState<BillingPeriod>("monthly");
  const [busy, setBusy] = useState(false);

  const urls = resolveTributeProUrls(me.tributeProUrls ?? me.tributeProUrl);
  const monthlyTributeUrl = urls[0];
  const yearlyTributeUrl = me.tributeProYearlyUrl ?? null;
  const liteCrewUrl = urls[1] ?? null;
  const pricing = me.proPricing;

  async function buyWithStars() {
    setBusy(true);
    try {
      const create =
        period === "yearly" ? () => api.createProYearlyInvoice() : () => api.createProInvoice();
      await openTelegramInvoice(create);
    } finally {
      setBusy(false);
    }
  }

  const priceLine =
    period === "yearly"
      ? t("pro.priceLineYearly", {
          stars: pricing?.yearlyStars ?? 1199,
          days: pricing?.yearlyDays ?? 365,
        })
      : t("pro.priceLineMonthly", {
          stars: pricing?.monthlyStars ?? 149,
          days: pricing?.monthlyDays ?? 30,
        });

  return (
    <div className="pro-checkout">
      <div className="pro-checkout__period" role="tablist" aria-label={t("pro.billingPeriod")}>
        <button
          type="button"
          role="tab"
          aria-selected={period === "monthly"}
          className={`pro-checkout__period-btn${period === "monthly" ? " pro-checkout__period-btn--active" : ""}`}
          onClick={() => setPeriod("monthly")}
        >
          {t("pro.billingMonthly")}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={period === "yearly"}
          className={`pro-checkout__period-btn${period === "yearly" ? " pro-checkout__period-btn--active" : ""}`}
          onClick={() => setPeriod("yearly")}
        >
          {t("pro.billingYearly")}
          <span className="pro-checkout__save">{t("pro.billingYearlySave")}</span>
        </button>
      </div>

      <p className="pro-paywall__price">{priceLine}</p>

      {period === "yearly" && yearlyTributeUrl ? (
        <ProTributeButton url={yearlyTributeUrl} source={`${source}-yearly`}>
          {t("pro.buyTributeYearly")}
        </ProTributeButton>
      ) : period === "monthly" && monthlyTributeUrl ? (
        <ProTributeButton url={monthlyTributeUrl} source={`${source}-monthly`}>
          {t("pro.buyTribute")}
        </ProTributeButton>
      ) : (
        <ProSubscribeButton busy={busy} onClick={() => void buyWithStars()}>
          {period === "yearly" ? t("pro.buyStarsYearly") : t("pro.buyBtn")}
        </ProSubscribeButton>
      )}

      {period === "monthly" && monthlyTributeUrl && (
        <button
          type="button"
          className="btn btn-ghost btn-block pro-checkout__stars-alt"
          onClick={() => void buyWithStars()}
          disabled={busy}
        >
          {t("pro.buyStarsAlt", { stars: pricing?.monthlyStars ?? 149 })}
        </button>
      )}

      {period === "yearly" && yearlyTributeUrl && (
        <button
          type="button"
          className="btn btn-ghost btn-block pro-checkout__stars-alt"
          onClick={() => void buyWithStars()}
          disabled={busy}
        >
          {t("pro.buyStarsYearlyAlt", { stars: pricing?.yearlyStars ?? 1199 })}
        </button>
      )}

      {liteCrewUrl && period === "monthly" && (
        <div className="pro-tribute-options pro-checkout__lite">
          <ProTributeButton url={liteCrewUrl} source={`${source}-lite`} variant="channel">
            {t("liteCrew.buyBtn")}
          </ProTributeButton>
        </div>
      )}
    </div>
  );
}
