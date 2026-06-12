import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAppPreferences } from "../../hooks/useAppPreferences";
import { createPipAudio } from "../../lib/pipRun/audio";
import {
  createGame,
  drawGame,
  loadBestScore,
  onTap,
  returnToMenu,
  saveBestScore,
  startEndless,
  startStage,
  tick,
  victoryStars,
} from "../../lib/pipRun/engine";
import {
  applyVictory,
  loadProgress,
  saveProgress,
  type PipProgress,
} from "../../lib/pipRun/progress";
import type { GameState } from "../../lib/pipRun/types";
import { WorldMap } from "./WorldMap";

const SIM_MS = 1000 / 60;
const MAX_STEPS = 5;

function measureWrap(el: HTMLDivElement): { w: number; h: number } {
  const w = Math.max(280, Math.floor(el.clientWidth || Math.min(480, window.innerWidth - 32)));
  const h = Math.max(300, Math.floor(Math.min(w * 1.35, window.innerHeight - 260)));
  return { w, h };
}

export function PipRunGame() {
  const { t } = useTranslation();
  const { prefs } = useAppPreferences();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<GameState | null>(null);
  const rafRef = useRef(0);
  const dprRef = useRef(1);
  const accumRef = useRef(0);
  const lastTsRef = useRef(0);
  const dirtyRef = useRef(true);
  const audioRef = useRef(createPipAudio());
  const prevMotesRef = useRef(0);
  const prevPhaseRef = useRef(stateRef.current?.phase ?? "menu");
  const victorySavedRef = useRef(false);
  const progressRef = useRef(loadProgress());

  const [best, setBest] = useState(loadBestScore);
  const [progress, setProgress] = useState<PipProgress>(loadProgress);
  const [phase, setPhase] = useState(stateRef.current?.phase ?? "menu");
  const [score, setScore] = useState(0);
  const [showMap, setShowMap] = useState(false);
  const [stars, setStars] = useState<1 | 2 | 3>(1);
  const [muted, setMuted] = useState(audioRef.current.isMuted);

  progressRef.current = progress;

  const syncHud = useCallback((s: GameState) => {
    setPhase(s.phase);
    setScore(s.score);
  }, []);

  const resize = useCallback(
    (reset: boolean) => {
      const wrap = wrapRef.current;
      const canvas = canvasRef.current;
      if (!wrap || !canvas) return false;
      const { w, h } = measureWrap(wrap);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      dprRef.current = dpr;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      if (reset || !stateRef.current) {
        stateRef.current = createGame(w, h, prefs.reduceMotion);
        syncHud(stateRef.current);
      } else {
        stateRef.current = { ...stateRef.current, width: w, height: h };
      }
      dirtyRef.current = true;
      return true;
    },
    [prefs.reduceMotion, syncHud],
  );

  useEffect(() => {
    resize(true);
    const onResize = () => resize(stateRef.current?.phase !== "playing");
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [resize]);

  const begin = useCallback(
    async (next: GameState) => {
      await audioRef.current.unlock();
      stateRef.current = next;
      dirtyRef.current = true;
      setShowMap(false);
      prevMotesRef.current = next.motesCollected;
      lastTsRef.current = 0;
      syncHud(next);
      if (next.phase === "playing") audioRef.current.onJump();
    },
    [syncHud],
  );

  useEffect(() => {
    const loop = (ts: number) => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      let state = stateRef.current;
      const playing = state?.phase === "playing";

      if (ctx && state) {
        if (playing) {
          const frameDt = lastTsRef.current ? Math.min(ts - lastTsRef.current, 48) : SIM_MS;
          accumRef.current += frameDt;
          let steps = 0;
          while (accumRef.current >= SIM_MS && steps < MAX_STEPS) {
            state = tick(state, SIM_MS);
            accumRef.current -= SIM_MS;
            steps += 1;
          }
          stateRef.current = state;

          if (state.motesCollected > prevMotesRef.current) audioRef.current.onCollect();
          prevMotesRef.current = state.motesCollected;

          if (state.phase === "gameover" && prevPhaseRef.current === "playing") {
            audioRef.current.onHit();
            if (state.score > best) {
              saveBestScore(state.score);
              setBest(state.score);
            }
          }

          if (state.phase === "victory" && prevPhaseRef.current === "playing") {
            audioRef.current.onVictory();
            if (!victorySavedRef.current) {
              victorySavedRef.current = true;
              const s = victoryStars(state);
              setStars(s);
              const next = applyVictory(
                progressRef.current,
                state.world,
                state.stage,
                s,
                state.isBoss,
              );
              saveProgress(next);
              setProgress(next);
            }
          }
          if (state.phase !== "victory") victorySavedRef.current = false;

          prevPhaseRef.current = state.phase;
          syncHud(state);
          dirtyRef.current = true;
          lastTsRef.current = ts;
        }

        const staticScene = state.phase !== "playing";
        if (dirtyRef.current || playing || staticScene) {
          ctx.setTransform(dprRef.current, 0, 0, dprRef.current, 0, 0);
          drawGame(ctx, state);
          dirtyRef.current = false;
        }
      }

      if (!playing) lastTsRef.current = 0;
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [best, syncHud]);

  const handleTap = useCallback(async () => {
    if (showMap) return;
    if (!resize(false)) return;
    const state = stateRef.current;
    if (!state || state.phase === "victory") return;
    await begin(onTap(state));
  }, [begin, resize, showMap]);

  return (
    <div className="piprun-game">
      <div className="piprun-hud">
        <button
          type="button"
          className="piprun-mute"
          onClick={() => setMuted(audioRef.current.toggleMute())}
        >
          {muted ? t("nutriRun.soundOff") : t("nutriRun.soundOn")}
        </button>
        <span>
          {t("nutriRun.best")}: <strong>{best}</strong>
        </span>
        <span>
          {t("nutriRun.score")}: <strong>{score}</strong>
        </span>
        {progress.bossTokens > 0 && (
          <span className="piprun-tokens">{t("nutriRun.tokens", { count: progress.bossTokens })}</span>
        )}
      </div>

      <div
        ref={wrapRef}
        className="piprun-canvas-wrap"
        role="button"
        tabIndex={0}
        onPointerDown={(e) => {
          e.preventDefault();
          void handleTap();
        }}
      >
        <canvas ref={canvasRef} className="piprun-canvas" />

        {phase === "menu" && !showMap && (
          <div className="piprun-overlay">
            <div className="piprun-overlay-card">
              <h3>{t("nutriRun.title")}</h3>
              <p>{t("nutriRun.menuHint")}</p>
              <div className="piprun-overlay-btns">
                <button type="button" className="btn primary" onClick={() => void begin(startEndless(stateRef.current!))}>
                  {t("nutriRun.endless")}
                </button>
                <button type="button" className="btn secondary" onClick={() => setShowMap(true)}>
                  {t("nutriRun.adventure")}
                </button>
              </div>
            </div>
          </div>
        )}

        {phase === "gameover" && (
          <div className="piprun-overlay">
            <div className="piprun-overlay-card">
              <h3>{t("nutriRun.gameOver")}</h3>
              <p>{t("nutriRun.gameOverHint", { score })}</p>
              <button type="button" className="btn primary" onClick={() => void handleTap()}>
                {t("nutriRun.retry")}
              </button>
            </div>
          </div>
        )}

        {phase === "victory" && (
          <div className="piprun-overlay">
            <div className="piprun-overlay-card">
              <h3>{t("nutriRun.victory")}</h3>
              <p className="piprun-stars">{"★".repeat(stars)}{"☆".repeat(3 - stars)}</p>
              <div className="piprun-overlay-btns">
                <button
                  type="button"
                  className="btn primary"
                  onClick={() => {
                    stateRef.current = returnToMenu(stateRef.current!);
                    setShowMap(true);
                    dirtyRef.current = true;
                    syncHud(stateRef.current);
                  }}
                >
                  {t("nutriRun.toMap")}
                </button>
                <button type="button" className="btn secondary" onClick={() => void begin(startEndless(stateRef.current!))}>
                  {t("nutriRun.endless")}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <p className="muted small piprun-controls">{t("nutriRun.controls")}</p>

      {showMap && phase !== "playing" && (
        <WorldMap
          progress={progress}
          onSelect={(w, s) => void begin(startStage(stateRef.current!, w, s))}
          onClose={() => setShowMap(false)}
        />
      )}
    </div>
  );
}
