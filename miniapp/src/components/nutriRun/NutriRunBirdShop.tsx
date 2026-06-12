import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { api, type BirdCatalogRow, type BirdRosterResponse } from "../../api/client";

const BIRD_ORDER = ["classic", "ember", "frost", "neon", "royal", "storm"] as const;

const BIRD_SWATCH: Record<string, string> = {
  classic: "linear-gradient(135deg,#7fe0c0,#43c6e0)",
  ember: "linear-gradient(135deg,#ff8a65,#e64a19)",
  frost: "linear-gradient(135deg,#b3e5fc,#4fc3f7)",
  neon: "linear-gradient(135deg,#f48fb1,#26c6da)",
  royal: "linear-gradient(135deg,#ffd54f,#7e57c2)",
  storm: "linear-gradient(135deg,#fff176,#7e57c2)",
};

type Props = {
  onRosterChange: (roster: BirdRosterResponse) => void;
  onToast: (msg: string) => void;
};

export function NutriRunBirdShop({ onRosterChange, onToast }: Props) {
  const { t } = useTranslation();
  const [roster, setRoster] = useState<BirdRosterResponse | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await api.getGameBirds();
      setRoster(r);
      onRosterChange(r);
    } catch {
      /* guest */
    }
  }, [onRosterChange]);

  useEffect(() => {
    void load();
  }, [load]);

  const birds = roster
    ? [...roster.birds].sort(
        (a, b) => BIRD_ORDER.indexOf(a.id as (typeof BIRD_ORDER)[number]) - BIRD_ORDER.indexOf(b.id as (typeof BIRD_ORDER)[number]),
      )
    : [];

  const openInvoice = async (birdId: string) => {
    setBusy(birdId);
    try {
      const { invoiceLink } = await api.createGameBirdInvoice(birdId);
      const tg = window.Telegram?.WebApp;
      if (tg && "openInvoice" in tg) {
        (tg as { openInvoice: (url: string, cb?: (status: string) => void) => void }).openInvoice(
          invoiceLink,
          (status) => {
            if (status === "paid") {
              void load().then(() => onToast(t("nutriRun.birds.purchased")));
            }
          },
        );
      } else {
        window.open(invoiceLink, "_blank");
      }
    } catch {
      onToast(t("nutriRun.birds.purchaseFailed"));
    } finally {
      setBusy(null);
    }
  };

  const unlockXp = async (bird: BirdCatalogRow) => {
    setBusy(bird.id);
    try {
      const res = await api.unlockGameBirdXp(bird.id);
      if (res.ok) {
        await load();
        onToast(t("nutriRun.birds.unlockedXp", { name: t(`nutriRun.birds.${bird.id}.name`) }));
      }
    } catch {
      onToast(t("nutriRun.birds.notEnoughXp"));
    } finally {
      setBusy(null);
    }
  };

  const unlockStars = async (bird: BirdCatalogRow) => {
    setBusy(bird.id);
    try {
      const res = await api.unlockGameBirdStars(bird.id);
      if (res.ok) {
        await load();
        onToast(t("nutriRun.birds.unlockedStars", { name: t(`nutriRun.birds.${bird.id}.name`) }));
      }
    } catch {
      onToast(t("nutriRun.birds.notEnoughStars"));
    } finally {
      setBusy(null);
    }
  };

  const selectBird = async (bird: BirdCatalogRow) => {
    if (!bird.owned) return;
    setBusy(bird.id);
    try {
      await api.selectGameBird(bird.id);
      await load();
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="nutrirun-birdshop card">
      <button
        type="button"
        className="nutrirun-birdshop__toggle"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span>{t("nutriRun.birds.shopTitle")}</span>
        <span className="muted small">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="nutrirun-birdshop__body">
          {roster && (
            <p className="muted small nutrirun-birdshop__wallet">
              {t("nutriRun.birds.wallet", {
                xp: roster.availableXp,
                stars: roster.starBalance,
              })}
            </p>
          )}
          <div className="nutrirun-birdshop__grid">
            {birds.map((bird) => {
              const selected = roster?.selectedBirdId === bird.id;
              const isBusy = busy === bird.id;
              return (
                <article
                  key={bird.id}
                  className={`nutrirun-birdshop__card${selected ? " is-selected" : ""}${bird.owned ? " is-owned" : ""}`}
                >
                  <div
                    className="nutrirun-birdshop__avatar"
                    style={{ background: BIRD_SWATCH[bird.id] ?? BIRD_SWATCH.classic }}
                    aria-hidden
                  />
                  <h3>{t(`nutriRun.birds.${bird.id}.name`)}</h3>
                  <p className="muted small">{t(`nutriRun.birds.${bird.id}.perk`)}</p>
                  {bird.owned ? (
                    <button
                      type="button"
                      className={`btn btn-block${selected ? " btn-secondary" : " btn-primary"}`}
                      disabled={isBusy || selected}
                      onClick={() => void selectBird(bird)}
                    >
                      {selected ? t("nutriRun.birds.selected") : t("nutriRun.birds.select")}
                    </button>
                  ) : (
                    <div className="nutrirun-birdshop__actions">
                      {bird.xpPrice != null && bird.xpPrice > 0 && (
                        <button
                          type="button"
                          className="btn btn-secondary btn-block"
                          disabled={isBusy || (roster?.availableXp ?? 0) < bird.xpPrice}
                          onClick={() => void unlockXp(bird)}
                        >
                          {bird.xpPrice} XP
                        </button>
                      )}
                      {bird.starPrice > 0 && (
                        <button
                          type="button"
                          className="btn btn-secondary btn-block"
                          disabled={isBusy || (roster?.starBalance ?? 0) < bird.starPrice}
                          onClick={() => void unlockStars(bird)}
                        >
                          {bird.starPrice} ⭐
                        </button>
                      )}
                      {bird.invoiceStars > 0 && (
                        <button
                          type="button"
                          className="btn btn-primary btn-block"
                          disabled={isBusy}
                          onClick={() => void openInvoice(bird.id)}
                        >
                          {t("nutriRun.birds.buyTelegram", { stars: bird.invoiceStars })}
                        </button>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
