import { Link } from "react-router-dom";
import { NavBadgeIcon, type NavBadgeKind } from "../nav/NavBadgeIcon";

type Variant = "pro" | "channel" | "muted";
type Size = "default" | "compact" | "hero";

type Props = {
  to: string;
  label: string;
  kind: NavBadgeKind;
  variant?: Variant;
  size?: Size;
  locked?: boolean;
};

export function ProActionTile({
  to,
  label,
  kind,
  variant = "muted",
  size = "default",
  locked,
}: Props) {
  const shellClass = [
    "pro-cta-shell",
    "pro-cta-shell--tile",
    size === "compact" ? "pro-cta-shell--compact" : "",
    size === "hero" ? "pro-cta-shell--hero" : "",
    variant !== "muted" ? `pro-cta-shell--${variant}` : "pro-cta-shell--tile-muted",
    locked ? "pro-action-tile--locked" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const iconSize = size === "hero" ? 44 : size === "compact" ? 34 : 40;

  return (
    <Link to={to} className={`pro-action-tile pro-action-tile--${size}`}>
      <div className={shellClass}>
        <span className="pro-cta-aurora" aria-hidden="true" />
        <span className="pro-cta-glow" aria-hidden="true" />
        <span className="pro-cta-orbit" aria-hidden="true" />
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
