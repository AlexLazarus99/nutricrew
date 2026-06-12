import { useMemo, useState, type CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import { isStageUnlocked, stageKey, type PipProgress } from "../../lib/pipRun/progress";
import { PIP_WORLDS, stageCount } from "../../lib/pipRun/worlds";

type Props = {
  progress: PipProgress;
  onSelect: (world: number, stage: number) => void;
  onClose: () => void;
};

function starText(n: 0 | 1 | 2 | 3 | undefined): string {
  if (!n) return "—";
  return "★".repeat(n) + "☆".repeat(3 - n);
}

export function WorldMap({ progress, onSelect, onClose }: Props) {
  const { t } = useTranslation();
  const [worldIdx, setWorldIdx] = useState(() =>
    Math.min(progress.unlockedWorld, PIP_WORLDS.length - 1),
  );

  const world = PIP_WORLDS[worldIdx]!;
  const locked = world.isBonus && !progress.bonusUnlocked;

  const stages = useMemo(() => {
    const total = stageCount(worldIdx);
    return Array.from({ length: total }, (_, i) => {
      const stage = i + 1;
      return {
        stage,
        unlocked: isStageUnlocked(progress, worldIdx, stage),
        stars: progress.stars[stageKey(worldIdx, stage)],
        boss: stage === total,
      };
    });
  }, [progress, worldIdx]);

  return (
    <div className="piprun-map card">
      <div className="piprun-map-header">
        <h3>{t("nutriRun.mapTitle")}</h3>
        <button type="button" className="piprun-map-close" onClick={onClose}>
          {t("nutriRun.mapClose")}
        </button>
      </div>
      <p className="muted small">
        {locked
          ? t("nutriRun.bonusLocked", { count: progress.bossTokens, need: 5 })
          : t("nutriRun.mapHint", { world: t(world.nameKey, { defaultValue: world.defaultName }) })}
      </p>

      <div className="piprun-world-tabs" role="tablist">
        {PIP_WORLDS.map((w, idx) => {
          const wLocked = w.isBonus ? !progress.bonusUnlocked : idx > progress.unlockedWorld;
          const active = idx === worldIdx;
          return (
            <button
              key={w.id}
              type="button"
              role="tab"
              aria-selected={active}
              disabled={wLocked}
              className={`piprun-world-tab${active ? " is-active" : ""}${wLocked ? " is-locked" : ""}`}
              style={{ "--w-accent": w.accent } as CSSProperties}
              onClick={() => !wLocked && setWorldIdx(idx)}
            >
              <span className="piprun-world-num">{idx + 1}</span>
              <span>{t(w.nameKey, { defaultValue: w.defaultName })}</span>
            </button>
          );
        })}
      </div>

      <ol className="piprun-stage-grid">
        {stages.map(({ stage, unlocked, stars, boss }) => (
          <li key={stage}>
            <button
              type="button"
              className={`piprun-stage-btn${unlocked && !locked ? "" : " is-locked"}`}
              style={{ "--w-accent": world.accent } as CSSProperties}
              disabled={!unlocked || locked}
              onClick={() => onSelect(worldIdx, stage)}
            >
              <span>{boss ? "👑" : stage}</span>
              <span className="piprun-stage-stars">{unlocked ? starText(stars) : "🔒"}</span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}
