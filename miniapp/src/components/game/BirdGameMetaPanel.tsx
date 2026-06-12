import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { BirdGameMetaResponse } from "../../api/client";
import {
  claimDailyChallenge,
  fetchGameMeta,
  purchaseBirdUpgrade,
} from "../../lib/birdGame/gameMetaClient";
import { getCurrentSeason } from "../../lib/birdGame/seasonal";
import { CollapsibleSection } from "../CollapsibleSection";

type Props = {
  onMetaLoaded?: (meta: BirdGameMetaResponse) => void;
  disabled?: boolean;
};

export function BirdGameMetaPanel({ onMetaLoaded, disabled }: Props) {
  const { t } = useTranslation();
  const [meta, setMeta] = useState<BirdGameMetaResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const season = getCurrentSeason();

  const reload = useCallback(() => {
    void fetchGameMeta().then((m) => {
      setMeta(m);
      onMetaLoaded?.(m);
    });
  }, [onMetaLoaded]);

  useEffect(() => {
    reload();
  }, [reload]);

  async function handleClaim() {
    if (!meta?.daily.done || meta.daily.claimed) return;
    setBusy(true);
    setMsg(null);
    const res = await claimDailyChallenge();
    if (res) {
      setMsg(t("game.dailyClaimed", { stars: res.rewardStars }));
      reload();
    } else {
      setMsg(t("game.dailyClaimError"));
    }
    setBusy(false);
  }

  async function handleUpgrade(kind: "ghost" | "gap" | "nearMiss") {
    setBusy(true);
    setMsg(null);
    const ok = await purchaseBirdUpgrade(kind);
    setMsg(ok ? t("game.upgradeOk") : t("game.upgradeError"));
    reload();
    setBusy(false);
  }

  if (!meta) {
    return (
      <CollapsibleSection
        title={t("game.metaPanelTitle")}
        className="card bird-game-meta-panel"
        storageKey="nutricrew_bird_meta_open"
      >
        <p className="muted small">{t("common.loading")}</p>
      </CollapsibleSection>
    );
  }

  const dailySummary = meta.daily.done
    ? t("game.dailyDone", { target: meta.daily.target })
    : t("game.dailyProgress", { best: meta.daily.best, target: meta.daily.target });

  return (
    <CollapsibleSection
      title={t("game.metaPanelTitle")}
      summary={`${t(season.scoreLabelKey)} · ${dailySummary}`}
      className="card bird-game-meta-panel"
      storageKey="nutricrew_bird_meta_open"
    >
      <p className="bird-game-season small">{t(season.scoreLabelKey)}</p>

      <div className="bird-game-daily-row">
        <span>
          {meta.daily.done
            ? t("game.dailyDone", { target: meta.daily.target })
            : t("game.dailyProgress", { best: meta.daily.best, target: meta.daily.target })}
        </span>
        {meta.daily.done && !meta.daily.claimed && (
          <button
            type="button"
            className="btn btn-primary btn-sm"
            disabled={disabled || busy}
            onClick={() => void handleClaim()}
          >
            {t("game.dailyClaim", { stars: meta.daily.rewardStars })}
          </button>
        )}
        {meta.daily.claimed && <span className="muted small">{t("game.dailyClaimedShort")}</span>}
      </div>

      {meta.birdBoost.active && (
        <p className="bird-game-boost-hint small success">{t("game.mealShieldActive")}</p>
      )}

      <h4 className="bird-game-upgrades-title">{t("game.upgradesTitle")}</h4>
      <p className="muted small">{t("game.upgradesHint")}</p>
      <div className="bird-game-upgrades-grid">
        {(["ghost", "gap", "nearMiss"] as const).map((kind) => {
          const level =
            kind === "ghost"
              ? meta.upgrades.ghostLevel
              : kind === "gap"
                ? meta.upgrades.gapLevel
                : meta.upgrades.nearMissLevel;
          const cost = meta.upgradeCosts[kind];
          return (
            <button
              key={kind}
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={disabled || busy || cost == null}
              onClick={() => void handleUpgrade(kind)}
            >
              {t(`game.upgrade_${kind}`, { level, cost: cost ?? "—" })}
            </button>
          );
        })}
      </div>

      {msg && <p className="small success">{msg}</p>}
    </CollapsibleSection>
  );
}
