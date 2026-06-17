import { Link } from "react-router-dom";
import { NavBadgeIcon, type NavBadgeKind } from "../nav/NavBadgeIcon";

export type ProTileTone =
  | "food"
  | "coach"
  | "guide"
  | "quiz"
  | "game"
  | "report"
  | "pro"
  | "prizes"
  | "features";

type Size = "default" | "compact";

type Props = {
  to: string;
  label: string;
  kind: NavBadgeKind;
  tone?: ProTileTone;
  size?: Size;
  locked?: boolean;
};

export function ProActionTile({
  to,
  label,
  kind,
  tone = "features",
  size = "default",
  locked,
}: Props) {
  const shellClass = [
    "pro-cta-shell",
    "pro-cta-shell--tile",
    `pro-cta-shell--tone-${tone}`,
    size === "compact" ? "pro-cta-shell--compact" : "",
    locked ? "pro-action-tile--locked" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const iconSize = size === "compact" ? 28 : 32;

  return (
    <Link to={to} className={`pro-action-tile pro-action-tile--${size}`}>
      <div className={shellClass}>
        <span className="pro-cta-aurora" aria-hidden="true" />
        <span className="pro-cta-glow" aria-hidden="true" />
        <span className="pro-cta-wave" aria-hidden="true" />
        <span className="pro-action-tile__body">
          <span className="pro-cta__shine" aria-hidden="true" />
          <span className="pro-action-tile__icon-wrap">
            <NavBadgeIcon kind={kind} size={iconSize} animated />
            {locked ? (
              <span className="pro-action-tile__lock" aria-hidden>
                🔒
              </span>
            ) : null}
          </span>
          <span className="pro-action-tile__label">{label}</span>
        </span>
      </div>
    </Link>
  );
}
