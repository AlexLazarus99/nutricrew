import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { MeResponse } from "../api/client";
import { CREW_LEVELS } from "../lib/progressLevels";

type Props = {
  progress: MeResponse["progress"];
  compact?: boolean;
};

export function ProgressLevelCard({ progress, compact = false }: Props) {
  const { t } = useTranslation();
  const [showRoadmap, setShowRoadmap] = useState(false);

  const title = t(`progress.titles.${progress.titleKey}`);

  return (
    <div className="card progress-level-card" data-tutorial="progress-card">
      <div className="progress-level-header">
        <span className="progress-level-emoji" aria-hidden>
          {progress.emoji}
        </span>
        <div className="progress-level-meta">
          <span className="progress-level-badge">
            {t("progress.levelShort", { level: progress.level })}
          </span>
          <h3 className="progress-level-title">{title}</h3>
          {!compact && (
            <p className="muted small">{t("progress.xpTotal", { xp: progress.xp })}</p>
          )}
        </div>
        <button
          type="button"
          className="btn btn-ghost btn-sm progress-level-info"
          onClick={() => setShowRoadmap((v) => !v)}
          aria-expanded={showRoadmap}
        >
          {showRoadmap ? "▲" : "▼"}
        </button>
      </div>

      <div className="progress-xp-bar" role="progressbar" aria-valuenow={progress.percent} aria-valuemin={0} aria-valuemax={100}>
        <div className="progress-xp-fill" style={{ width: `${progress.percent}%` }} />
      </div>
      <p className="progress-xp-caption muted small">
        {progress.maxLevel
          ? t("progress.maxLevel")
          : t("progress.toNext", {
              current: progress.xpInLevel,
              need: progress.xpToNext,
              next: progress.level + 1,
            })}
      </p>

      {showRoadmap && (
        <ul className="progress-roadmap">
          {CREW_LEVELS.map((row) => {
            const reached = progress.xp >= row.xp;
            const current = progress.level === row.level;
            return (
              <li
                key={row.level}
                className={`progress-roadmap-item ${reached ? "reached" : ""} ${current ? "current" : ""}`}
              >
                <span className="progress-roadmap-emoji">{row.emoji}</span>
                <span className="progress-roadmap-level">Lv.{row.level}</span>
                <span className="progress-roadmap-name">{t(`progress.titles.${row.titleKey}`)}</span>
                <span className="progress-roadmap-xp muted small">{row.xp} XP</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
