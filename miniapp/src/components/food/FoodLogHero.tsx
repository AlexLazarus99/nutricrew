import { useTranslation } from "react-i18next";
import type { MeResponse } from "../../api/client";
import { ProgressLevelCard } from "../ProgressLevelCard";
import { LevelBadgeIcon } from "../LevelBadgeIcon";

type Props = {
  progress: MeResponse["progress"];
  titleKey: string;
  subtitleKey: string;
  compactBadge?: boolean;
};

/** Shared header for log + diary: level badge, title, progress bar. */
export function FoodLogHero({ progress, titleKey, subtitleKey, compactBadge }: Props) {
  const { t } = useTranslation();

  if (compactBadge) {
    return (
      <div className="food-log-hero food-log-hero--compact">
        <ProgressLevelCard progress={progress} compact />
      </div>
    );
  }

  return (
    <div className="food-log-hero card">
      <div className="food-log-hero__row">
        <div className="food-log-hero__badge">
          <LevelBadgeIcon titleKey={progress.titleKey} size={96} active />
        </div>
        <div className="food-log-hero__copy">
          <span className="food-log-hero__level">
            {t("progress.levelShort", { level: progress.level })}
          </span>
          <h2>{t(titleKey)}</h2>
          <p className="muted small">{t(subtitleKey)}</p>
        </div>
      </div>
      <div className="food-log-hero__xp">
        <div className="progress-xp-bar" role="progressbar" aria-valuenow={progress.percent}>
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
      </div>
    </div>
  );
}
