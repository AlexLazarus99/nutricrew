import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { MeResponse } from "../api/client";
import { CREW_LEVELS } from "../lib/progressLevels";
import { LevelBadgeIcon } from "./LevelBadgeIcon";

type Props = {
  progress: MeResponse["progress"];
  compact?: boolean;
  bannerTitle?: string;
  bannerSubtitle?: string;
  tutorialId?: string;
};

export function ProgressLevelCard({
  progress,
  compact = false,
  bannerTitle,
  bannerSubtitle,
  tutorialId,
}: Props) {
  const { t } = useTranslation();
  const [showRoadmap, setShowRoadmap] = useState(false);

  const title = t(`progress.titles.${progress.titleKey}`);

  return (
    <div
      className="card progress-level-card"
      data-tutorial={tutorialId ?? "progress-card"}
    >
      {(bannerTitle || bannerSubtitle) && (
        <div className="progress-level-banner">
          {bannerTitle && <h2 className="progress-level-banner__title">{bannerTitle}</h2>}
          {bannerSubtitle && <p className="progress-level-banner__subtitle muted">{bannerSubtitle}</p>}
        </div>
      )}
      <div className="progress-level-header">
        <div className="progress-level-badge-wrap">
          <LevelBadgeIcon titleKey={progress.titleKey} size={168} active />
        </div>
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
                <LevelBadgeIcon
                  titleKey={row.titleKey}
                  size={108}
                  active={current}
                  dimmed={!reached}
                />
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
