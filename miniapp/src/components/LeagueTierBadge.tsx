import { useTranslation } from "react-i18next";
import { LeagueTierBadgeIcon } from "./LeagueTierBadgeIcon";

const TIERS = ["bronze", "silver", "gold", "platinum", "diamond"] as const;
export type LeagueTier = (typeof TIERS)[number];

type Props = {
  tier: string;
  weeklyXp: number;
  xpToNext?: number;
  size?: "sm" | "md";
};

function normalizeTier(tier: string): LeagueTier {
  const key = tier.toLowerCase() as LeagueTier;
  return TIERS.includes(key) ? key : "bronze";
}

export function LeagueTierBadge({ tier, weeklyXp, xpToNext, size = "md" }: Props) {
  const { t } = useTranslation();
  const normalized = normalizeTier(tier);
  const iconSize = size === "sm" ? 48 : 56;

  return (
    <div className={`league-tier-badge league-tier-badge--${normalized} league-tier-badge--${size}`}>
      <span className="league-tier-badge__ring" aria-hidden />
      <LeagueTierBadgeIcon tier={normalized} size={iconSize} />
      <div className="league-tier-badge__meta">
        <strong className="league-tier-badge__name">
          {t(`features.leagueTiers.${normalized}`)}
        </strong>
        <span className="league-tier-badge__xp muted small">
          {weeklyXp} XP
          {xpToNext != null && xpToNext > 0
            ? ` · ${t("features.leagueNext", { xp: xpToNext })}`
            : ""}
        </span>
      </div>
    </div>
  );
}
