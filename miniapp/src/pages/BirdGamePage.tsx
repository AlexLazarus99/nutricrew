import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  api,
  type BirdGameLeaderboardEntry,
  type BirdGameMetaResponse,
  type MeResponse,
} from "../api/client";
import {
  NutriRunActivities,
  type NutriRunLastRun,
} from "../components/nutriRun/NutriRunActivities";
import { NutriRunBirdShop } from "../components/nutriRun/NutriRunBirdShop";
import type { BirdRosterResponse } from "../api/client";
import { tryClaimDailyBonus } from "../lib/claimDailyBonus";
import { useMe } from "../hooks/useMe";

type NutriRunMessage = {
  source?: string;
  event?: string;
  score?: number;
  level?: number;
  flights?: number;
  fruits?: number;
  best?: number;
  artifactXp?: number;
  stars?: number;
  marathon?: boolean;
};

function buildNutriBoostPayload(me: MeResponse | null | undefined, meta: BirdGameMetaResponse | null) {
  const growth = me?.growth;
  const mealsDone = (me?.mealsToday ?? 0) >= (me?.mealsTodayTarget ?? 3);
  const wellnessDone = !!growth?.dailyGoal?.done;
  const birdBoost = !!(meta?.birdBoost?.active || growth?.birdBoost?.active);
  const streakDays = me?.streak?.days ?? 0;
  let kind: string | null = null;
  let label = "";
  if (birdBoost) {
    kind = "game";
    label = "Бонус NutriCrew · щит";
  } else if (wellnessDone) {
    kind = "wellness";
    label = "Цель дня · +жизнь";
  } else if (mealsDone) {
    kind = "meals";
    label = "Дневник еды · шире зазоры";
  } else if (streakDays >= 3) {
    kind = "streak";
    label = "Серия "+streakDays+" дн. · буст";
  }
  const appBirdUnlocks: string[] = [];
  if (streakDays >= 7) appBirdUnlocks.push("storm");
  else if (streakDays >= 3) appBirdUnlocks.push("frost");
  return {
    source: "nutricrew" as const,
    event: "nutriboost" as const,
    active: !!(kind || birdBoost),
    kind,
    label,
    streakDays,
    appBirdUnlocks,
  };
}

function scoreLevelForApi(score: number): number {
  return Math.max(1, Math.floor(score / 3) + 1);
}

export function BirdGamePage() {
  const { t } = useTranslation();
  const { me, refresh } = useMe();
  const [meta, setMeta] = useState<BirdGameMetaResponse | null>(null);
  const [leaderboard, setLeaderboard] = useState<BirdGameLeaderboardEntry[] | null>(null);
  const [lastRun, setLastRun] = useState<NutriRunLastRun | null>(null);
  const [claimBusy, setClaimBusy] = useState(false);
  const [collapsed, setCollapsed] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [roster, setRoster] = useState<BirdRosterResponse | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const syncRosterToGame = useCallback((r: BirdRosterResponse) => {
    iframeRef.current?.contentWindow?.postMessage(
      {
        source: "nutricrew",
        event: "roster",
        selectedBirdId: r.selectedBirdId,
        ownedBirdIds: r.birds.filter((b) => b.owned).map((b) => b.id),
      },
      "*",
    );
  }, []);

  const syncNutriBoostToGame = useCallback(() => {
    iframeRef.current?.contentWindow?.postMessage(buildNutriBoostPayload(me, meta), "*");
  }, [me, meta]);

  const syncGameContext = useCallback(() => {
    syncNutriBoostToGame();
    if (roster) syncRosterToGame(roster);
  }, [roster, syncNutriBoostToGame, syncRosterToGame]);

  const loadSideData = useCallback(async () => {
    try {
      const [m, lb] = await Promise.all([api.getGameMeta(), api.getBirdLeaderboard()]);
      setMeta(m);
      setLeaderboard(lb.entries);
    } catch {
      /* offline / guest */
    }
  }, []);

  useEffect(() => {
    void loadSideData();
  }, [loadSideData]);

  useEffect(() => {
    syncNutriBoostToGame();
  }, [syncNutriBoostToGame]);

  const handleGameOver = useCallback(
    async (msg: NutriRunMessage) => {
      const score = Math.max(0, Math.round(Number(msg.score) || 0));
      const fruits = Math.max(0, Math.round(Number(msg.fruits) || 0));
      const flights = Math.max(0, Math.round(Number(msg.flights) || 0));
      const level = scoreLevelForApi(score);

      let improved = false;
      try {
        const res = await api.submitBirdScore({ score, level, fruits });
        improved = res.improved;
      } catch {
        /* keep local run visible */
      }

      const bonusPts = await tryClaimDailyBonus("game");
      await loadSideData();
      await refresh();

      setLastRun({ score, flights, fruits, improved });
      const artifactXp = Math.max(0, Math.round(Number(msg.artifactXp) || 0));
      if (artifactXp > 0) {
        setToast(`Артефакт забега: +${artifactXp} XP`);
      } else if (bonusPts) {
        setToast(t("growth.dailyBonusClaimed", { points: bonusPts }));
      } else if (improved) {
        setToast(t("nutriRun.activities.syncedBest"));
      }
    },
    [loadSideData, refresh, t],
  );

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      const data = e.data as NutriRunMessage;
      if (data?.source !== "nutrirun" || data.event !== "game_over") return;
      void handleGameOver(data);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [handleGameOver]);

  const onClaimDaily = async () => {
    setClaimBusy(true);
    try {
      const res = await api.claimBirdDaily();
      if (res.ok) {
        setToast(t("nutriRun.activities.starsClaimed", { stars: res.rewardStars }));
        await loadSideData();
        await refresh();
      }
    } catch {
      setToast(t("nutriRun.activities.claimFailed"));
    } finally {
      setClaimBusy(false);
    }
  };

  return (
    <section className="stack nutrirun-page" aria-label={t("nutriRun.title")}>
      <div className="card hero nutrirun-hero">
        <h1 className="nutrirun-hero__title">{t("nutriRun.title")}</h1>
        <p className="muted small">{t("nutriRun.playHint")}</p>
      </div>

      {toast && (
        <p className="nutrirun-toast small" role="status">
          {toast}
          <button type="button" className="nutrirun-toast__dismiss" onClick={() => setToast(null)} aria-label="OK">
            ×
          </button>
        </p>
      )}

      <div className="bird-quest-page nutrirun-game-first">
        <iframe
          ref={iframeRef}
          src="/bird-quest.html"
          title={t("nutriRun.title")}
          className="bird-quest-frame"
          allow="autoplay"
          onLoad={() => {
            syncGameContext();
          }}
        />
      </div>

      <NutriRunActivities
        meta={meta}
        leaderboard={leaderboard}
        teamBonusDone={!!me?.dailyBonus.game}
        lastRun={lastRun}
        claimBusy={claimBusy}
        onClaimDaily={() => void onClaimDaily()}
        collapsed={collapsed}
        onToggleCollapsed={() => setCollapsed((v) => !v)}
      />

      <NutriRunBirdShop
        onRosterChange={(r) => {
          setRoster(r);
          syncRosterToGame(r);
          syncNutriBoostToGame();
        }}
        onToast={setToast}
      />
    </section>
  );
}
