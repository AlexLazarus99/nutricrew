import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  createGame,
  drawGame,
  flap,
  loadBestScore,
  saveBestScore,
  tick,
} from "../../lib/birdGame/engine";
import {
  fetchBirdLeaderboard,
  submitBirdScore,
  type BirdLeaderboardEntry,
} from "../../lib/birdGame/leaderboard";
import type { GamePhase, GameState } from "../../lib/birdGame/types";

function measureWrap(wrap: HTMLDivElement): { w: number; h: number } {
  const measuredW = wrap.clientWidth;
  const w = Math.max(
    280,
    Math.floor(measuredW > 0 ? measuredW : Math.min(480, window.innerWidth - 32)),
  );
  const h = Math.max(320, Math.floor(Math.min(w * 1.35, window.innerHeight - 200)));
  return { w, h };
}

export function NutriBirdGame() {
  const { t } = useTranslation();
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

  const syncHud = useCallback((state: GameState) => {
    setHudScore(state.score);
    setNutrition(Math.round(state.bird.nutrition));
    setLevel(state.level);
    setPhase(state.phase);
    setFruits(state.fruitsCollected);
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
    if (resetWorld || !prev) {
      stateRef.current = createGame(w, h);
    } else if (prev.phase === "playing") {
      stateRef.current = { ...prev, width: w, height: h };
    } else if (sizeChanged) {
      stateRef.current = createGame(w, h);
    }

    return true;
  }, []);

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;

    const init = () => {
      if (cancelled) return;
      if (applySize(true)) {
        if (stateRef.current) syncHud(stateRef.current);
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
          syncHud(stateRef.current);
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
    const lastHudRef = { score: -1, nutrition: -1, phase: "idle" as GamePhase };

    const loop = (ts: number) => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      const dpr = dprRef.current;
      let state = stateRef.current;

      if (ctx) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        if (state?.phase === "playing") {
          const dt = lastTsRef.current ? ts - lastTsRef.current : 16;
          state = tick(state, dt);
          stateRef.current = state;

          if (state.phase === "gameover") {
            if (state.score > bestScore) {
              saveBestScore(state.score);
              setBestScore(state.score);
            }
            void submitBirdScore(state.score, state.level, state.fruitsCollected).then(() =>
              refreshLeaderboard(),
            );
          }

          const n = Math.round(state.bird.nutrition);
          if (
            state.score !== lastHudRef.score ||
            n !== lastHudRef.nutrition ||
            state.phase !== lastHudRef.phase
          ) {
            lastHudRef.score = state.score;
            lastHudRef.nutrition = n;
            lastHudRef.phase = state.phase;
            syncHud(state);
          }
        }

        if (state) {
          drawGame(ctx, state);
        } else if (canvas) {
          ctx.fillStyle = "#87CEEB";
          ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);
        }
      }

      lastTsRef.current = ts;
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [bestScore, syncHud, refreshLeaderboard]);

  const handleTap = useCallback(() => {
    const playing = stateRef.current?.phase === "playing";
    if (!applySize(!playing)) return;
    const state = stateRef.current;
    if (!state) return;
    stateRef.current = flap(state);
    syncHud(stateRef.current);
  }, [applySize, syncHud]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault();
        handleTap();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleTap]);

  return (
    <div className="bird-game">
      <div className="bird-game-meta">
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
      </div>
      <div
        ref={wrapRef}
        className="bird-game-canvas-wrap"
        role="button"
        tabIndex={0}
        aria-label={t("game.tapHint")}
        onPointerDown={(e) => {
          e.preventDefault();
          handleTap();
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
        {canvasReady && (phase === "idle" || phase === "gameover") && (
          <div className="bird-game-overlay">
            <div className="bird-game-overlay-card">
              <h3>{phase === "idle" ? t("game.startTitle") : t("game.overTitle")}</h3>
              <p>
                {phase === "idle"
                  ? t("game.startHint")
                  : t("game.overHint", { score: hudScore, fruit: fruits })}
              </p>
            </div>
          </div>
        )}
      </div>
      <p className="muted small bird-game-hint">{t("game.tapHint")}</p>

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

      <ul className="bird-game-legend small muted">
        <li>{t("game.legendTrees")}</li>
        <li>{t("game.legendJunk")}</li>
        <li>{t("game.legendSkyFood")}</li>
        <li>{t("game.legendMountain")}</li>
        <li>{t("game.legendWhale")}</li>
        <li>{t("game.legendOctopus")}</li>
        <li>{t("game.legendNight")}</li>
        <li>{t("game.legendWolves")}</li>
        <li>{t("game.legendMeteor")}</li>
        <li>{t("game.legendPtero")}</li>
        <li>{t("game.legendBoss")}</li>
        <li>{t("game.legendFruit")}</li>
        <li>{t("game.legendSpeed")}</li>
      </ul>
    </div>
  );
}
