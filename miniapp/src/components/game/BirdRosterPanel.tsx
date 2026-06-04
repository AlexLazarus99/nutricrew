import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { api, type BirdCatalogRow, type BirdRosterResponse } from "../../api/client";
import { BIRD_UI, type BirdId } from "../../lib/birdGame/birdCatalog";
import {
  drawBirdRosterPortrait,
  ROSTER_PREVIEW_H,
  ROSTER_PREVIEW_W,
  setupRosterCanvas,
} from "../../lib/birdGame/birdRosterArt";

type BirdRosterPanelProps = {
  selectedBirdId: string;
  onSelect: (birdId: string) => void;
  onStarBalance?: (balance: number) => void;
  disabled?: boolean;
};

export function BirdRosterPanel({
  selectedBirdId,
  onSelect,
  onStarBalance,
  disabled,
}: BirdRosterPanelProps) {
  const { t } = useTranslation();
  const [roster, setRoster] = useState<BirdRosterResponse | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const previewRefs = useRef<Map<string, HTMLCanvasElement>>(new Map());
  const previewDprRef = useRef<Map<string, number>>(new Map());
  const syncedRef = useRef(false);

  const load = useCallback(() => {
    void api.getGameBirds().then((data) => {
      setRoster(data);
      onStarBalance?.(data.starBalance);
      if (!syncedRef.current && data.selectedBirdId) {
        syncedRef.current = true;
        onSelect(data.selectedBirdId);
      }
    });
  }, [onSelect, onStarBalance]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    let raf = 0;
    const draw = (ts: number) => {
      for (const [id, canvas] of previewRefs.current) {
        const ctx = canvas.getContext("2d");
        const dpr = previewDprRef.current.get(id) ?? 1;
        if (!ctx) continue;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        const owned = roster?.birds.find((b) => b.id === id)?.owned ?? true;
        drawBirdRosterPortrait(ctx, id, ROSTER_PREVIEW_W, ROSTER_PREVIEW_H, ts, {
          locked: !owned,
        });
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [roster]);

  async function openInvoice(birdId: string) {
    setBusy(birdId);
    setMsg(null);
    try {
      const { invoiceLink } = await api.createGameBirdInvoice(birdId);
      const tg = window.Telegram?.WebApp;
      if (tg && "openInvoice" in tg) {
        (tg as { openInvoice: (url: string) => void }).openInvoice(invoiceLink);
      } else {
        window.open(invoiceLink, "_blank");
      }
    } catch {
      setMsg(t("birds.errorInvoice"));
    } finally {
      setBusy(null);
    }
  }

  async function unlockStars(bird: BirdCatalogRow) {
    setBusy(bird.id);
    setMsg(null);
    try {
      const res = await api.unlockGameBirdStars(bird.id);
      onStarBalance?.(res.starBalance);
      onSelect(res.selectedBirdId);
      load();
      setMsg(t("birds.unlocked"));
    } catch {
      setMsg(t("birds.errorStars"));
    } finally {
      setBusy(null);
    }
  }

  async function unlockXp(bird: BirdCatalogRow) {
    if (!bird.xpPrice) return;
    setBusy(bird.id);
    setMsg(null);
    try {
      const res = await api.unlockGameBirdXp(bird.id);
      onSelect(res.selectedBirdId);
      load();
      setMsg(t("birds.unlocked"));
    } catch {
      setMsg(t("birds.errorXp"));
    } finally {
      setBusy(null);
    }
  }

  async function selectBird(bird: BirdCatalogRow) {
    if (!bird.owned) return;
    setBusy(bird.id);
    try {
      await api.selectGameBird(bird.id);
      onSelect(bird.id);
      load();
    } finally {
      setBusy(null);
    }
  }

  if (!roster) {
    return (
      <div className="bird-roster card">
        <p className="muted small">{t("common.loading")}</p>
      </div>
    );
  }

  return (
    <div className="bird-roster card">
      <div className="bird-roster-head">
        <h3>{t("birds.title")}</h3>
        <div className="bird-roster-balances">
          <span className="bird-roster-stars">
            ⭐ {roster.starBalance} {t("birds.balance")}
          </span>
          <span className="bird-roster-xp">
            ✨ {roster.availableXp} {t("birds.xpAvailable")} / {roster.totalXp}
          </span>
        </div>
      </div>
      <p className="muted small">{t("birds.subtitle")}</p>
      {msg && <p className="success small">{msg}</p>}

      <div className="bird-roster-grid">
        {roster.birds.map((bird) => {
          const ui = BIRD_UI[bird.id as BirdId];
          const active = selectedBirdId === bird.id;
          const isBusy = busy === bird.id;
          const starsOnly =
            bird.starsOnly ?? (!bird.free && (bird.xpPrice == null || bird.xpPrice <= 0));
          const canXp =
            !bird.owned &&
            !starsOnly &&
            bird.xpPrice != null &&
            bird.xpPrice > 0 &&
            roster.availableXp >= bird.xpPrice;
          return (
            <article
              key={bird.id}
              className={`bird-roster-card${active ? " bird-roster-card--active" : ""}${bird.owned ? "" : " bird-roster-card--locked"}`}
              style={{ "--bird-accent": ui?.accent ?? "#FFD54F" } as Record<string, string>}
            >
              <div className="bird-roster-preview-wrap">
                <canvas
                  ref={(el) => {
                    if (el) {
                      previewRefs.current.set(bird.id, el);
                      const setup = setupRosterCanvas(el);
                      if (setup) {
                        previewDprRef.current.set(bird.id, el.width / ROSTER_PREVIEW_W);
                      }
                    } else {
                      previewRefs.current.delete(bird.id);
                      previewDprRef.current.delete(bird.id);
                    }
                  }}
                  className="bird-roster-preview"
                  width={ROSTER_PREVIEW_W}
                  height={ROSTER_PREVIEW_H}
                  aria-hidden
                />
              </div>
              <h4>
                {t(`birds.names.${bird.id}`)}
                {starsOnly && !bird.owned && (
                  <span className="bird-roster-exclusive">{t("birds.exclusive")}</span>
                )}
              </h4>
              <p className="bird-roster-skills small muted">
                {t(`birds.skills.${bird.id}`)}
              </p>
              {bird.trials.length > 0 && (
                <ul className="bird-roster-trials small">
                  {bird.trials.map((trial) => (
                    <li
                      key={trial.id}
                      className={trial.completed ? "bird-roster-trial-done" : undefined}
                    >
                      {trial.completed ? "✓ " : ""}
                      {t("birds.trialRow", {
                        level: trial.requiredLevel,
                        stars: trial.rewardStars,
                      })}
                    </li>
                  ))}
                </ul>
              )}
              <div className="bird-roster-actions">
                {bird.owned ? (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    disabled={disabled || isBusy || active}
                    onClick={() => void selectBird(bird)}
                  >
                    {active ? t("birds.equipped") : t("birds.equip")}
                  </button>
                ) : (
                  <>
                    {bird.xpPrice != null && bird.xpPrice > 0 && (
                      <button
                        type="button"
                        className="btn btn-primary btn-sm bird-roster-btn-xp"
                        disabled={disabled || isBusy || !canXp}
                        onClick={() => void unlockXp(bird)}
                      >
                        {t("birds.unlockXp", { xp: bird.xpPrice })}
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      disabled={disabled || isBusy || roster.starBalance < bird.starPrice}
                      onClick={() => void unlockStars(bird)}
                    >
                      ⭐ {bird.starPrice}
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      disabled={disabled || isBusy}
                      onClick={() => void openInvoice(bird.id)}
                    >
                      {t("birds.buyTelegram", { stars: bird.invoiceStars })}
                    </button>
                  </>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
