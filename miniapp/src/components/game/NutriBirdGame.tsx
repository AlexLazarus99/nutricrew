import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  applyVictoryProgress,
  createGame,
  drawGame,
  flap,
  loadBestScore,
  returnToIdle,
  saveBestScore,
  startEndless,
  startStage,
  tick,
  victoryStars,
} from "../../lib/birdGame/runnerEngine";
import {
  loadRunnerProgress,
  saveRunnerProgress,
  type RunnerProgress,
} from "../../lib/birdGame/runnerWorlds";
import type { GameBootOptions } from "../../lib/birdGame/types";
import type { BirdGameMetaResponse } from "../../api/client";
import { samplesForSubmit } from "../../lib/birdGame/gameSession";
import { fetchDuelOpponent } from "../../lib/birdGame/gameMetaClient";
import { metaGapBonus, metaGhostBonusMs, metaNearMissMult } from "../../lib/birdGame/gameModifiers";
import { getCurrentSeason } from "../../lib/birdGame/seasonal";
import { useAppPreferences } from "../../hooks/useAppPreferences";
import {
  fetchBirdLeaderboard,
  submitBirdScore,
  type BirdLeaderboardEntry,
} from "../../lib/birdGame/leaderboard";
import { createBirdGameAudio, loadMusicMuted } from "../../lib/birdGame/birdGameAudio";
import type { GamePhase, GameState } from "../../lib/birdGame/types";
import { DEFAULT_BIRD_ID } from "../../lib/birdGame/birdCatalog";
import { resolveBirdId } from "../../lib/birdGame/birdModifiers";
import { tryClaimDailyBonus } from "../../lib/claimDailyBonus";
import { clearJuiceEvents } from "../../lib/birdGame/gameJuice";
import { gameHaptic } from "../../lib/birdGame/gameHaptics";
import {
  hudSnapshot,
  MAX_SIM_STEPS_PER_FRAME,
  SIM_STEP_MS,
  clampTickDt,
} from "../../lib/birdGame/gameRuntime";

import { NutriBirdMark } from "./NutriBirdMark";
import { BirdGameMetaPanel } from "./BirdGameMetaPanel";
import { RunnerWorldMap } from "./RunnerWorldMap";
import { CollapsibleSection } from "../CollapsibleSection";

const BirdRosterPanel = lazy(() =>
  import("./BirdRosterPanel").then((m) => ({ default: m.BirdRosterPanel })),
);

const HUD_SYNC_MS = 140;

function measureWrap(wrap: HTMLDivElement): { w: number; h: number } {
  const measuredW = wrap.clientWidth;
  const w = Math.max(
    280,
    Math.floor(measuredW > 0 ? measuredW : Math.min(480, window.innerWidth - 32)),
  );
  const h = Math.max(320, Math.floor(Math.min(w * 1.35, window.innerHeight - 280)));
  return { w, h };
}

type NutriBirdGameProps = {
  onActivity?: () => void;
};

export function NutriBirdGame({ onActivity }: NutriBirdGameProps = {}) {
  const { t } = useTranslation();
  const { prefs } = useAppPreferences();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<GameState | null>(null);
  const dprRef = useRef(1);
  const sizeRef = useRef({ w: 0, h: 0 });
  const rafRef = useRef(0);
  const lastTsRef = useRef(0);
  const [bestScore, setBestScore] = useState(loadBestScore);
  const [hudScore, setHudScore] = useState(0);
  const [nutrition, setNutrition] = useState(0);
  const [level, setLevel] = useState(1);
  const [phase, setPhase] = useState<GamePhase>("idle");
  const [fruits, setFruits] = useState(0);
  const [canvasReady, setCanvasReady] = useState(false);
  const [leaderboard, setLeaderboard] = useState<BirdLeaderboardEntry[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);
  const [musicMuted, setMusicMuted] = useState(loadMusicMuted);
  const [bonusToast, setBonusToast] = useState<string | null>(null);
  const [selectedBirdId, setSelectedBirdId] = useState<string>(DEFAULT_BIRD_ID);
  const [trialToast, setTrialToast] = useState<string | null>(null);
  const [comboStreak, setComboStreak] = useState(0);
  const [ghostSeconds, setGhostSeconds] = useState(0);
  const [nitroStacks, setNitroStacks] = useState(0);
  const [birdBoostHits, setBirdBoostHits] = useState(0);
  const [zoneLabel, setZoneLabel] = useState("");
  const [paused, setPaused] = useState(false);
  const [bossNear, setBossNear] = useState(false);
  const [showWorldMap, setShowWorldMap] = useState(false);
  const [runnerProgress, setRunnerProgress] = useState<RunnerProgress>(loadRunnerProgress);
  const [lastVictoryStars, setLastVictoryStars] = useState<1 | 2 | 3>(1);
  const victorySavedRef = useRef(false);
  const runnerProgressRef = useRef(runnerProgress);
  runnerProgressRef.current = runnerProgress;
  const gameBootRef = useRef<GameBootOptions>({});
  const audioRef = useRef(createBirdGameAudio());
  const prevPhaseRef = useRef<GamePhase>("idle");
  const prevFruitsRef = useRef(0);
  const tabVisibleRef = useRef(true);
  const dirtyRef = useRef(true);
  const lastHudSyncRef = useRef(0);
  const simAccumRef = useRef(0);

  const syncHud = useCallback(
    (snap: ReturnType<typeof hudSnapshot>) => {
      setHudScore(snap.score);
      setNutrition(snap.nutrition);
      setLevel(snap.level);
      setPhase(snap.phase);
      setFruits(snap.fruitsCollected);
      setComboStreak(snap.comboStreak);
      setGhostSeconds(snap.ghostSeconds);
      setNitroStacks(snap.nitroStacks);
      setBirdBoostHits(snap.birdBoostHits);
      setPaused(snap.paused);
      setBossNear(snap.bossNear);
      const baseZone = t(snap.zoneKey, { defaultValue: snap.zoneFallback });
      const elev =
        snap.elevationKey && snap.elevationFallback
          ? t(snap.elevationKey, { defaultValue: snap.elevationFallback })
          : null;
      setZoneLabel(elev ? `${baseZone} · ${elev}` : baseZone);
    },
    [t],
  );

  const applyBootFromMeta = useCallback(
    async (meta: BirdGameMetaResponse) => {
      const season = getCurrentSeason();
      const opponent = await fetchDuelOpponent(meta.daily.best || bestScore);
      gameBootRef.current = {
        birdBoostActive: meta.birdBoost.active,
        reduceMotion: prefs.reduceMotion,
        metaGhostBonusMs: metaGhostBonusMs(meta.upgrades),
        metaGapBonus: metaGapBonus(meta.upgrades),
        metaNearMissMult: metaNearMissMult(meta.upgrades),
        seasonalNutritionMult: season.nutritionMult,
        ghostDuel: opponent
          ? { name: opponent.name, score: opponent.score, samples: opponent.samples }
          : null,
      };
    },
    [bestScore, prefs.reduceMotion],
  );

  const processJuiceEvents = useCallback((state: GameState) => {
    if (state.juiceEvents.length === 0) return;
    const audio = audioRef.current;
    for (const e of state.juiceEvents) {
      if (e.type === "nearMiss") {
        audio.onNearMiss();
        gameHaptic("light");
      } else if (e.type === "combo") {
        audio.onCombo();
        gameHaptic("medium");
      } else if (e.type === "levelUp") {
        gameHaptic("success");
      }
    }
    stateRef.current = clearJuiceEvents(state);
  }, []);

  /** Resize canvas bitmap and game world — never triggers React state except first ready. */
  const applySize = useCallback((resetWorld: boolean) => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return false;

    const { w, h } = measureWrap(wrap);
    const sizeChanged = sizeRef.current.w !== w || sizeRef.current.h !== h;
    if (!sizeChanged && stateRef.current && !resetWorld) return true;

    sizeRef.current = { w, h };
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    dprRef.current = dpr;

    canvas.width = Math.max(1, Math.floor(w * dpr));
    canvas.height = Math.max(1, Math.floor(h * dpr));

    const prev = stateRef.current;
    const species = resolveBirdId(selectedBirdId);
    if (resetWorld || !prev) {
      stateRef.current = createGame(w, h, species, gameBootRef.current);
    } else if (prev.phase === "playing") {
      stateRef.current = { ...prev, width: w, height: h };
    } else if (sizeChanged) {
      stateRef.current = createGame(w, h, species, gameBootRef.current);
    }

    return true;
  }, [selectedBirdId]);

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;

    const init = () => {
      if (cancelled) return;
      if (applySize(true)) {
        if (stateRef.current) syncHud(hudSnapshot(stateRef.current));
        dirtyRef.current = true;
        setCanvasReady(true);
        return;
      }
      if (attempts < 30) {
        attempts += 1;
        requestAnimationFrame(init);
      }
    };

    init();

    let resizeTimer = 0;
    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        const playing = stateRef.current?.phase === "playing";
        if (applySize(!playing) && stateRef.current && !playing) {
          syncHud(hudSnapshot(stateRef.current));
          dirtyRef.current = true;
        }
      }, 100);
    };

    window.addEventListener("resize", onResize);
    return () => {
      cancelled = true;
      window.clearTimeout(resizeTimer);
      window.removeEventListener("resize", onResize);
    };
  }, [applySize, syncHud]);

  const refreshLeaderboard = useCallback(() => {
    setLeaderboardLoading(true);
    void fetchBirdLeaderboard()
      .then(setLeaderboard)
      .finally(() => setLeaderboardLoading(false));
  }, []);

  useEffect(() => {
    refreshLeaderboard();
  }, [refreshLeaderboard]);

  useEffect(() => {
    const audio = audioRef.current;
    const onVisible = () => {
      tabVisibleRef.current = document.visibilityState === "visible";
      dirtyRef.current = true;
      if (tabVisibleRef.current && stateRef.current?.phase === "playing") {
        void audio.startMusic();
        lastTsRef.current = 0;
      } else if (!tabVisibleRef.current) {
        audio.stopMusic();
      }
    };
    tabVisibleRef.current = document.visibilityState === "visible";
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      audio.dispose();
    };
  }, []);

  useEffect(() => {
    const loop = (ts: number) => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      const dpr = dprRef.current;
      let state = stateRef.current;
      const playing = state?.phase === "playing";
      const shouldSimulate = playing && tabVisibleRef.current;

      if (ctx && state) {
        if (shouldSimulate) {
          const frameDt = lastTsRef.current ? ts - lastTsRef.current : SIM_STEP_MS;
          simAccumRef.current += clampTickDt(frameDt);
          let steps = 0;
          try {
            while (simAccumRef.current >= SIM_STEP_MS && steps < MAX_SIM_STEPS_PER_FRAME) {
              state = tick(state, SIM_STEP_MS);
              simAccumRef.current -= SIM_STEP_MS;
              steps += 1;
            }
            stateRef.current = state;
            if (steps > 0) {
              processJuiceEvents(state);
              dirtyRef.current = true;
            }
          } catch (err) {
            console.error("[NutriBird] tick failed", err);
            state = { ...state, phase: "gameover" };
            stateRef.current = state;
            simAccumRef.current = 0;
            dirtyRef.current = true;
          }

          if (state.fruitsCollected > prevFruitsRef.current) {
            audioRef.current.onFruit();
            gameHaptic("light");
          }
          prevFruitsRef.current = state.fruitsCollected;

          if (ts - lastHudSyncRef.current >= HUD_SYNC_MS) {
            lastHudSyncRef.current = ts;
            syncHud(hudSnapshot(state));
          }
        }

        if (state.phase === "gameover" && prevPhaseRef.current === "playing") {
          audioRef.current.onGameOver();
          gameHaptic("warning");
        }
        if (state.phase === "victory" && prevPhaseRef.current === "playing") {
          gameHaptic("success");
          audioRef.current.stopMusic();
          if (!victorySavedRef.current) {
            victorySavedRef.current = true;
            const stars = victoryStars(state);
            setLastVictoryStars(stars);
            const next = applyVictoryProgress(state, runnerProgressRef.current);
            saveRunnerProgress(next);
            setRunnerProgress(next);
          }
        }
        if (state.phase !== "victory") {
          victorySavedRef.current = false;
        }
        prevPhaseRef.current = state.phase;

        if (!shouldSimulate) {
          simAccumRef.current = 0;
        }

        if (state.phase === "gameover" && dirtyRef.current) {
          audioRef.current.stopMusic();
          dirtyRef.current = false;
          syncHud(hudSnapshot(state));
          if (state.score > bestScore) {
            saveBestScore(state.score);
            setBestScore(state.score);
          }
          void submitBirdScore(
            state.score,
            state.level,
            state.fruitsCollected,
            state.birdSpeciesId,
            samplesForSubmit(state.ghostSamples),
          ).then((res) => {
            refreshLeaderboard();
            const done = res?.trials?.newlyCompleted ?? [];
            if (done.length > 0) {
              const total = done.reduce((s, x) => s + x.rewardStars, 0);
              setTrialToast(t("birds.trialComplete", { stars: total }));
              window.setTimeout(() => setTrialToast(null), 5000);
            }
          });
          void tryClaimDailyBonus("game").then((pts) => {
            if (pts) {
              setBonusToast(t("growth.dailyBonusClaimed", { points: pts }));
              onActivity?.();
              window.setTimeout(() => setBonusToast(null), 4000);
            }
          });
        } else if (state.phase === "playing" && tabVisibleRef.current) {
          void audioRef.current.startMusic();
        }

        const staticScene =
          state.phase === "idle" || state.phase === "gameover" || state.phase === "victory";
        const shouldDraw = dirtyRef.current || shouldSimulate || staticScene;
        if (shouldDraw) {
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          try {
            drawGame(ctx, state);
            dirtyRef.current = false;
          } catch (err) {
            console.error("[NutriBird] draw failed at level", state.level, err);
            dirtyRef.current = staticScene;
          }
        }
      } else if (canvas && dirtyRef.current) {
        const ctx2 = canvas.getContext("2d");
        if (ctx2) {
          ctx2.setTransform(dpr, 0, 0, dpr, 0, 0);
          ctx2.fillStyle = "#87CEEB";
          ctx2.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);
        }
        dirtyRef.current = false;
      }

      if (shouldSimulate) lastTsRef.current = ts;
      else if (!playing) lastTsRef.current = 0;

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [bestScore, syncHud, refreshLeaderboard, processJuiceEvents, onActivity, t]);

  const beginRun = useCallback(
    async (nextState: GameState) => {
      const audio = audioRef.current;
      await audio.unlock();
      audio.onFlap();
      gameHaptic("light");
      stateRef.current = nextState;
      dirtyRef.current = true;
      if (nextState.phase === "playing") {
        setShowWorldMap(false);
        await audio.startMusic();
        prevFruitsRef.current = nextState.fruitsCollected;
        prevPhaseRef.current = "playing";
        lastTsRef.current = 0;
      }
      syncHud(hudSnapshot(nextState));
    },
    [syncHud],
  );

  const handleTap = useCallback(async () => {
    if (showWorldMap) return;
    const playing = stateRef.current?.phase === "playing";
    if (!applySize(!playing)) return;
    const state = stateRef.current;
    if (!state) return;
    if (state.phase === "victory") return;

    await beginRun(flap(state));
  }, [applySize, beginRun, showWorldMap]);

  const handleQuickRun = useCallback(async () => {
    if (!applySize(false)) return;
    const state = stateRef.current;
    if (!state || state.phase === "playing") return;
    await beginRun(startEndless(state));
  }, [applySize, beginRun]);

  const handleSelectStage = useCallback(
    async (world: number, stage: number) => {
      if (!applySize(false)) return;
      const state = stateRef.current;
      if (!state || state.phase === "playing") return;
      await beginRun(startStage(state, world, stage));
    },
    [applySize, beginRun],
  );

  const handleVictoryContinue = useCallback(() => {
    const state = stateRef.current;
    if (!state) return;
    stateRef.current = returnToIdle(state);
    dirtyRef.current = true;
    setShowWorldMap(true);
    syncHud(hudSnapshot(stateRef.current));
  }, [syncHud]);

  const handleVictoryQuickRun = useCallback(() => {
    void handleQuickRun();
  }, [handleQuickRun]);

  const toggleMusic = useCallback(() => {
    const muted = audioRef.current.toggleMute();
    setMusicMuted(muted);
    if (!muted && stateRef.current?.phase === "playing") {
      void audioRef.current.startMusic();
    } else if (muted) {
      audioRef.current.stopMusic();
    }
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault();
        void handleTap();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleTap]);

  const handleBirdSelect = useCallback(
    (birdId: string) => {
      setSelectedBirdId(birdId);
      const wrap = wrapRef.current;
      if (!wrap) return;
      const { w, h } = measureWrap(wrap);
      const prev = stateRef.current;
      if (!prev || prev.phase !== "playing") {
        stateRef.current = createGame(w, h, resolveBirdId(birdId), gameBootRef.current);
        syncHud(hudSnapshot(stateRef.current));
        dirtyRef.current = true;
      } else {
        stateRef.current = { ...prev, birdSpeciesId: resolveBirdId(birdId) };
        dirtyRef.current = true;
      }
    },
    [syncHud],
  );

  const togglePause = useCallback(() => {
    const state = stateRef.current;
    if (!state || state.phase !== "playing") return;
    stateRef.current = { ...state, paused: !state.paused };
    dirtyRef.current = true;
    syncHud(hudSnapshot(stateRef.current));
  }, [syncHud]);

  return (
    <div className="bird-game">
      <BirdGameMetaPanel
        onMetaLoaded={(m) => {
          void applyBootFromMeta(m).then(() => {
            if (stateRef.current?.phase === "idle") applySize(true);
          });
        }}
        disabled={phase === "playing"}
      />
      <div className="bird-game-meta bird-game-meta--rich">
        <button
          type="button"
          className="bird-game-music-btn"
          onClick={toggleMusic}
          aria-pressed={musicMuted}
          aria-label={musicMuted ? t("game.musicUnmute") : t("game.musicMute")}
        >
          {musicMuted ? t("game.musicOff") : t("game.musicOn")}
        </button>
        <span>
          {t("game.best")}: <strong>{bestScore}</strong>
        </span>
        <span>
          {t("game.level")}: <strong>{level}</strong>
        </span>
        <span>
          {t("game.score")}: <strong>{hudScore}</strong>
        </span>
        <span>
          {t("game.nutrition")}: <strong>{nutrition}%</strong>
        </span>
        {zoneLabel && (
          <span className="bird-game-zone">
            {t("game.zone")}: <strong>{zoneLabel}</strong>
          </span>
        )}
        {ghostSeconds > 0 && phase === "playing" && (
          <span className="bird-game-ghost">{t("game.ghostHud", { sec: ghostSeconds })}</span>
        )}
        {nitroStacks > 0 && phase === "playing" && (
          <span className="bird-game-nitro">{t("game.nitroHud", { stacks: nitroStacks })}</span>
        )}
        {birdBoostHits > 0 && phase === "playing" && (
          <span className="bird-game-shield">{t("game.shieldHud", { hits: birdBoostHits })}</span>
        )}
        {bossNear && phase === "playing" && (
          <span className="bird-game-boss-warn">{t("game.bossNear")}</span>
        )}
        {phase === "playing" && (
          <button type="button" className="bird-game-pause-btn" onClick={togglePause}>
            {paused ? t("game.resume") : t("game.pause")}
          </button>
        )}
        {comboStreak >= 3 && phase === "playing" && (
          <span className="bird-game-combo">
            {t("game.combo", { count: comboStreak })}
          </span>
        )}
      </div>
      <div
        ref={wrapRef}
        className="bird-game-canvas-wrap"
        data-tutorial="game-canvas"
        role="button"
        tabIndex={0}
        aria-label={t("game.tapHint")}
        onPointerDown={(e) => {
          e.preventDefault();
          void handleTap();
        }}
      >
        <canvas ref={canvasRef} className="bird-game-canvas" />
        {!canvasReady && (
          <div className="bird-game-overlay">
            <div className="bird-game-overlay-card">
              <p>{t("common.loading")}</p>
            </div>
          </div>
        )}
        {canvasReady && (phase === "idle" || phase === "gameover") && !showWorldMap && (
          <div className="bird-game-overlay bird-game-overlay--actions">
            <div className="bird-game-overlay-card bird-game-overlay-card--splash">
              <NutriBirdMark size={64} showWordmark={phase === "idle"} animated={phase === "idle"} />
              <h3>{phase === "idle" ? t("game.startTitle") : t("game.overTitle")}</h3>
              <p>
                {phase === "idle"
                  ? t("game.startHint")
                  : t("game.overHint", { score: hudScore, fruit: fruits })}
              </p>
              {bonusToast && <p className="success small">{bonusToast}</p>}
              {trialToast && <p className="success small">{trialToast}</p>}
              <div className="bird-game-overlay-btns">
                <button type="button" className="btn primary" onClick={() => void handleQuickRun()}>
                  {t("game.quickRun")}
                </button>
                <button
                  type="button"
                  className="btn secondary"
                  onClick={() => setShowWorldMap(true)}
                >
                  {t("game.worldMapBtn")}
                </button>
              </div>
            </div>
          </div>
        )}
        {canvasReady && phase === "victory" && (
          <div className="bird-game-overlay bird-game-overlay--actions">
            <div className="bird-game-overlay-card bird-game-overlay-card--splash">
              <h3>{t("game.victoryTitle")}</h3>
              <p className="runner-victory-stars" aria-label={t("game.stageStars", { count: lastVictoryStars })}>
                {"★".repeat(lastVictoryStars)}
                {"☆".repeat(3 - lastVictoryStars)}
              </p>
              <p>{t("game.victoryHint", { score: hudScore, fruit: fruits })}</p>
              <div className="bird-game-overlay-btns">
                <button type="button" className="btn primary" onClick={handleVictoryContinue}>
                  {t("game.victoryMap")}
                </button>
                <button type="button" className="btn secondary" onClick={() => void handleVictoryQuickRun()}>
                  {t("game.quickRun")}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <p className="muted small bird-game-hint">
        {t("game.tapHint")} {t("game.musicHint")}
      </p>

      {showWorldMap && phase !== "playing" && (
        <RunnerWorldMap
          progress={runnerProgress}
          onSelectStage={(w, s) => void handleSelectStage(w, s)}
          onClose={() => setShowWorldMap(false)}
        />
      )}

      <div className="card bird-game-leaderboard">
        <h3>{t("game.leaderboardTitle")}</h3>
        <p className="muted small">{t("game.leaderboardHint")}</p>
        {leaderboardLoading ? (
          <p className="muted small">{t("common.loading")}</p>
        ) : leaderboard.length === 0 ? (
          <p className="muted small">{t("game.leaderboardEmpty")}</p>
        ) : (
          <ol className="bird-game-leaderboard-list">
            {leaderboard.map((row) => (
              <li
                key={`${row.rank}-${row.name}`}
                className={row.isYou ? "bird-game-leaderboard-you" : undefined}
              >
                <span className="bird-game-leaderboard-rank">#{row.rank}</span>
                <span className="bird-game-leaderboard-name">
                  {row.name}
                  {row.isYou ? ` (${t("game.leaderboardYou")})` : ""}
                </span>
                <span className="bird-game-leaderboard-score">
                  {t("game.leaderboardRow", { score: row.score, level: row.level })}
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>

      <CollapsibleSection
        title={t("game.guideTitle")}
        summary={t("game.guideSummary")}
        className="card bird-game-guide"
        storageKey="nutricrew_bird_guide_open"
      >
        <ul className="bird-game-legend small muted">
          <li>{t("game.legendRunner")}</li>
          <li>{t("game.legendGlide")}</li>
          <li>{t("game.legendWallRun")}</li>
          <li>{t("game.legendAttack")}</li>
          <li>{t("game.legendWorldMap")}</li>
          <li>{t("game.legendFruit")}</li>
          <li>{t("game.legendFruitTypes")}</li>
          <li>{t("game.legendShield")}</li>
          <li>{t("game.legendDuel")}</li>
        </ul>
      </CollapsibleSection>

      <section className="bird-nursery" aria-label={t("birds.title")}>
        <Suspense
          fallback={
            <div className="bird-roster card">
              <p className="muted small">{t("common.loading")}</p>
            </div>
          }
        >
          <BirdRosterPanel
            selectedBirdId={selectedBirdId}
            onSelect={handleBirdSelect}
            disabled={phase === "playing"}
          />
        </Suspense>
      </section>
    </div>
  );
}
