import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../api/client";
import { useMe } from "../hooks/useMe";
import { shareReferralLink } from "../lib/telegramShare";

export function ReferralsPage() {
  const { t } = useTranslation();
  const { me } = useMe();
  const [data, setData] = useState<Awaited<ReturnType<typeof api.getReferralsV2>> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [claimBusy, setClaimBusy] = useState<number | null>(null);

  useEffect(() => {
    void api
      .getReferralsV2()
      .then(setData)
      .catch((e: Error) => setError(e.message));
  }, []);

  function onShare() {
    if (!data?.shareUrl) return;
    const result = shareReferralLink({
      shareUrl: data.shareUrl,
      title: t("referrals.shareTitle"),
      text: t("referrals.shareText"),
    });
    setFeedback(result === "shared" ? t("referrals.shared") : t("referrals.copied"));
    window.setTimeout(() => setFeedback(null), 2500);
  }

  async function claimTier(count: number) {
    setClaimBusy(count);
    setError(null);
    try {
      const res = await api.claimReferralTier(count);
      setFeedback(t("referrals.claimedStars", { stars: res.stars }));
      const fresh = await api.getReferralsV2();
      setData(fresh);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setClaimBusy(null);
    }
  }

  return (
    <section className="stack referrals-page">
      <div className="card hero referrals-hero pro-animate-in">
        <p className="referrals-hero__badge">🤝</p>
        <h2>{t("referrals.title")}</h2>
        <p className="muted">{t("referrals.lead")}</p>
      </div>

      <div className="card referrals-rewards">
        <h3>{t("referrals.proRewardTitle")}</h3>
        <ul className="referrals-rewards__list">
          <li>{t("referrals.proRewardLite", { days: data?.rewards.proDaysLiteCrew ?? 7 })}</li>
          <li>{t("referrals.proRewardPro", { days: data?.rewards.proDaysPro ?? 14 })}</li>
        </ul>
      </div>

      {data && (
        <div className="card referrals-stats">
          <div className="referrals-stats__grid">
            <div>
              <span className="referrals-stats__value">{data.totalReferrals}</span>
              <span className="muted small">{t("referrals.total")}</span>
            </div>
            <div>
              <span className="referrals-stats__value">{data.activeReferrals}</span>
              <span className="muted small">{t("referrals.active")}</span>
            </div>
            <div>
              <span className="referrals-stats__value">{data.paidReferrals}</span>
              <span className="muted small">{t("referrals.paid")}</span>
            </div>
            <div>
              <span className="referrals-stats__value">{data.proDaysEarned}</span>
              <span className="muted small">{t("referrals.proDays")}</span>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <h3>{t("referrals.shareTitle")}</h3>
        <p className="muted small">{t("referrals.shareHint")}</p>
        {data?.shareUrl ? (
          <>
            <code className="referrals-link">{data.shareUrl}</code>
            <button type="button" className="btn btn-primary btn-block" onClick={onShare}>
              {t("referrals.shareBtn")}
            </button>
          </>
        ) : (
          <p className="muted small">{t("referrals.shareUnavailable", { bot: me.botUsername ?? "bot" })}</p>
        )}
        {feedback && <p className="success small">{feedback}</p>}
      </div>

      {data && (
        <div className="card">
          <h3>{t("referrals.tiersTitle")}</h3>
          <p className="muted small">{t("referrals.tiersHint")}</p>
          <ul className="referrals-tiers">
            {data.tiers.map((tier) => {
              const reached = data.activeReferrals >= tier.count;
              return (
                <li
                  key={tier.count}
                  className={`referrals-tiers__item${reached ? " referrals-tiers__item--ready" : ""}`}
                >
                  <span>{t("referrals.tierLine", { count: tier.count, stars: tier.stars })}</span>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    disabled={!reached || claimBusy != null}
                    onClick={() => void claimTier(tier.count)}
                  >
                    {claimBusy === tier.count ? "…" : t("referrals.claim")}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {error && <p className="error">{error}</p>}
    </section>
  );
}
