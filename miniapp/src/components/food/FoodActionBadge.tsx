import { useId } from "react";

type Props = {
  kind: "scan" | "photo";
  active?: boolean;
  size?: number;
};

export function FoodActionBadge({ kind, active = false, size = 52 }: Props) {
  const uid = useId().replace(/:/g, "");
  const g = (name: string) => `url(#${uid}-${name})`;
  const rootClass = [
    "food-action-badge",
    `food-action-badge--${kind}`,
    "food-action-badge--live",
    active ? "food-action-badge--active" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={rootClass} style={{ width: size, height: size }} aria-hidden>
      <span className="food-action-badge__ring" />
      <svg className="food-action-badge__svg" viewBox="0 0 64 64">
        <defs>
          <linearGradient id={`${uid}-panel`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fff" />
            <stop offset="100%" stopColor="#e8f0ea" />
          </linearGradient>
          <linearGradient id={`${uid}-cam`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#455a64" />
            <stop offset="100%" stopColor="#263238" />
          </linearGradient>
          <linearGradient id={`${uid}-lens`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#90caf9" />
            <stop offset="100%" stopColor="#1565c0" />
          </linearGradient>
        </defs>
        {kind === "scan" ? (
          <>
            <rect x="10" y="14" width="44" height="36" rx="6" fill={g("panel")} />
            <rect className="food-action-badge__code" x="16" y="22" width="3" height="20" rx="0.8" fill="#263238" />
            <rect className="food-action-badge__code" x="22" y="22" width="2" height="20" rx="0.8" fill="#263238" />
            <rect className="food-action-badge__code" x="27" y="22" width="4" height="20" rx="0.8" fill="#263238" />
            <rect className="food-action-badge__code" x="34" y="22" width="2" height="20" rx="0.8" fill="#263238" />
            <rect className="food-action-badge__code" x="39" y="22" width="3" height="20" rx="0.8" fill="#263238" />
            <rect className="food-action-badge__code" x="45" y="22" width="2" height="20" rx="0.8" fill="#263238" />
            <rect className="food-action-badge__scanline" x="12" y="24" width="40" height="2.5" rx="1.2" fill="#c9a227" opacity="0.9" />
          </>
        ) : (
          <>
            <rect x="12" y="20" width="40" height="28" rx="5" fill={g("cam")} />
            <rect x="24" y="14" width="16" height="8" rx="2" fill="#37474f" />
            <circle cx="32" cy="34" r="10" fill={g("lens")} />
            <circle cx="32" cy="34" r="5.5" fill="#0d47a1" opacity="0.55" />
            <circle className="food-action-badge__flash" cx="46" cy="26" r="3" fill="#fff59d" />
            <circle className="food-action-badge__glint" cx="29" cy="31" r="2" fill="#fff" opacity="0.85" />
          </>
        )}
      </svg>
    </span>
  );
}
