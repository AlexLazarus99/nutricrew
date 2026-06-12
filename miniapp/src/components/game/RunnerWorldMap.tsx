import { useMemo, useState, type CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import {
  RUNNER_WORLDS,
  isStageUnlocked,
  stageKey,
  type RunnerProgress,
} from "../../lib/birdGame/runnerWorlds";

type RunnerWorldMapProps = {
  progress: RunnerProgress;
  onSelectStage: (world: number, stage: number) => void;
  onClose: () => void;
};

function starsLabel(stars: 1 | 2 | 3 | undefined): string {
  if (!stars) return "—";
  return "★".repeat(stars) + "☆".repeat(3 - stars);
}

export function RunnerWorldMap({ progress, onSelectStage, onClose }: RunnerWorldMapProps) {
  const { t } = useTranslation();
  const [worldIdx, setWorldIdx] = useState(() =>
    Math.min(progress.unlockedWorld, RUNNER_WORLDS.length - 1),
  );

  const world = RUNNER_WORLDS[worldIdx]!;
  const worldLocked = worldIdx > progress.unlockedWorld;

  const stages = useMemo(() => {
    return Array.from({ length: world.levels }, (_, i) => {
      const stage = i + 1;
      const unlocked = isStageUnlocked(progress, worldIdx, stage);
      const stars = progress.stars[stageKey(worldIdx, stage)];
      return { stage, unlocked, stars };
    });
  }, [progress, worldIdx, world.levels]);

  return (
    <div className="runner-world-map" role="dialog" aria-label={t("game.worldMapTitle")}>
      <div className="runner-world-map-header">
        <h3>{t("game.worldMapTitle")}</h3>
        <button type="button" className="runner-world-map-close" onClick={onClose}>
          {t("game.worldMapClose")}
        </button>
      </div>

      <div className="runner-world-tabs" role="tablist">
        {RUNNER_WORLDS.map((w, idx) => {
          const locked = idx > progress.unlockedWorld;
          const active = idx === worldIdx;
          return (
            <button
              key={w.id}
              type="button"
              role="tab"
              aria-selected={active}
              className={`runner-world-tab${active ? " runner-world-tab--active" : ""}${locked ? " runner-world-tab--locked" : ""}`}
              style={{ "--world-accent": w.accent } as CSSProperties}
              onClick={() => !locked && setWorldIdx(idx)}
              disabled={locked}
            >
              <span className="runner-world-tab-num">{idx + 1}</span>
              <span className="runner-world-tab-name">
                {t(w.nameKey, { defaultValue: w.defaultName })}
              </span>
              {locked && <span className="runner-world-lock">🔒</span>}
            </button>
          );
        })}
      </div>

      <div className="runner-world-panel">
        <p className="runner-world-desc muted small">
          {worldLocked
            ? t("game.worldLocked")
            : t("game.worldMapHint", {
                world: t(world.nameKey, { defaultValue: world.defaultName }),
              })}
        </p>

        <ol className="runner-stage-grid">
          {stages.map(({ stage, unlocked, stars }) => (
            <li key={stage}>
              <button
                type="button"
                className={`runner-stage-btn${unlocked ? "" : " runner-stage-btn--locked"}`}
                style={{ "--world-accent": world.accent } as CSSProperties}
                disabled={!unlocked || worldLocked}
                onClick={() => onSelectStage(worldIdx, stage)}
              >
                <span className="runner-stage-num">{stage}</span>
                <span className="runner-stage-stars" aria-label={t("game.stageStars", { count: stars ?? 0 })}>
                  {unlocked ? starsLabel(stars) : "🔒"}
                </span>
              </button>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );

}
