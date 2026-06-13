import { useId, type CSSProperties, type ReactNode } from "react";
import { BrandPeachIcon } from "../BrandPeachIcon";
import { BirdBadge } from "../nutriRun/BirdBadge";

export type NavBadgeKind =
  | "home"
  | "food"
  | "guide"
  | "quiz"
  | "team"
  | "chat"
  | "rank"
  | "game"
  | "prizes"
  | "report";

type Props = {
  kind: NavBadgeKind;
  active?: boolean;
  size?: number;
};

function BadgeShell({
  active,
  size,
  children,
  className = "",
}: {
  active?: boolean;
  size: number;
  children: ReactNode;
  className?: string;
}) {
  const rootClass = ["nav-badge", active ? "nav-badge--active" : "", className]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={rootClass} style={{ "--nav-badge-size": `${size}px` } as CSSProperties}>
      <span className="nav-badge__ring" aria-hidden />
      <span className="nav-badge__shine" aria-hidden />
      {children}
    </span>
  );
}

function NavSvgBadge({
  kind,
  active,
  size = 34,
}: {
  kind: Exclude<NavBadgeKind, "home" | "game">;
  active?: boolean;
  size?: number;
}) {
  const uid = useId().replace(/:/g, "");
  const g = (name: string) => `url(#${uid}-${name})`;

  function art() {
    switch (kind) {
      case "food":
        return (
          <>
            <ellipse cx="24" cy="30" rx="14" ry="4" fill="#000" opacity="0.08" />
            <ellipse cx="24" cy="26" rx="13" ry="3.5" fill={g("plate")} />
            <path d="M12 26 Q24 18 36 26" fill={g("food")} />
            <circle className="nav-badge__steam" cx="20" cy="16" r="2.2" fill="#fff" opacity="0.75" />
            <circle className="nav-badge__steam nav-badge__steam--2" cx="26" cy="13" r="1.8" fill="#fff" opacity="0.6" />
            <path className="nav-badge__fork" d="M34 12 v11 M31 12 v7 M37 12 v7" stroke="#8b7355" strokeWidth="1.4" strokeLinecap="round" />
          </>
        );
      case "guide":
        return (
          <>
            <path d="M14 38 Q24 12 34 38 Z" fill={g("leaf")} />
            <path d="M24 16 Q26 28 24 38" stroke="#3d8b5a" strokeWidth="1.2" opacity="0.55" />
            <circle className="nav-badge__spark" cx="18" cy="22" r="1.5" fill="#fff9c4" />
          </>
        );
      case "quiz":
        return (
          <>
            <rect x="12" y="14" width="24" height="22" rx="4" fill={g("card")} />
            <text x="24" y="29" textAnchor="middle" fontSize="14" fontWeight="700" fill="#c9a227">
              ?
            </text>
            <circle className="nav-badge__spark" cx="34" cy="16" r="2" fill="#ffe082" />
          </>
        );
      case "team":
        return (
          <>
            <circle cx="17" cy="22" r="6" fill={g("crew")} />
            <circle cx="31" cy="22" r="6" fill={g("crew2")} />
            <path d="M10 36 Q24 28 38 36" fill={g("crew")} opacity="0.85" />
          </>
        );
      case "chat":
        return (
          <>
            <path d="M10 16 h28 a4 4 0 0 1 4 4 v10 a4 4 0 0 1-4 4 H18 l-6 6 v-6 h-2 a4 4 0 0 1-4-4 V20 a4 4 0 0 1 4-4z" fill={g("bubble")} />
            <circle className="nav-badge__dot" cx="18" cy="26" r="1.6" fill="#fff" />
            <circle className="nav-badge__dot nav-badge__dot--2" cx="24" cy="26" r="1.6" fill="#fff" />
            <circle className="nav-badge__dot nav-badge__dot--3" cx="30" cy="26" r="1.6" fill="#fff" />
          </>
        );
      case "rank":
        return (
          <>
            <path d="M14 34 h20 v-4 H14z" fill={g("gold")} />
            <path d="M18 34 V22 l6-8 6 8 v12" fill={g("gold")} />
            <circle className="nav-badge__spark" cx="24" cy="18" r="2.5" fill="#fff8e1" />
          </>
        );
      case "prizes":
        return (
          <>
            <path
              className="nav-badge__star"
              d="M24 10 l2.8 6.8 L34 18 l-5.5 4.5 L30 30 24 25.5 18 30 l1.5-7.5 L14 18 l7.2-1.2 Z"
              fill={g("gold")}
            />
          </>
        );
      case "report":
        return (
          <>
            <rect x="12" y="12" width="24" height="26" rx="3" fill={g("card")} />
            <rect className="nav-badge__bar nav-badge__bar--1" x="16" y="28" width="4" height="8" rx="1" fill="#5cb87a" />
            <rect className="nav-badge__bar nav-badge__bar--2" x="22" y="22" width="4" height="14" rx="1" fill="#c9a227" />
            <rect className="nav-badge__bar nav-badge__bar--3" x="28" y="18" width="4" height="18" rx="1" fill="#5aa8d8" />
            <path d="M15 18 h18" stroke="#8b7355" strokeWidth="1.2" opacity="0.45" />
          </>
        );
      default:
        return null;
    }
  }

  return (
    <BadgeShell active={active} size={size}>
      <svg className="nav-badge__svg" viewBox="0 0 48 48" aria-hidden>
        <defs>
          <linearGradient id={`${uid}-plate`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fffaf5" />
            <stop offset="100%" stopColor="#e8ddd2" />
          </linearGradient>
          <linearGradient id={`${uid}-food`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffd4b8" />
            <stop offset="100%" stopColor="#ffab91" />
          </linearGradient>
          <linearGradient id={`${uid}-leaf`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#b8f0c8" />
            <stop offset="100%" stopColor="#5cb87a" />
          </linearGradient>
          <linearGradient id={`${uid}-card`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fff" />
            <stop offset="100%" stopColor="#e8f0ea" />
          </linearGradient>
          <linearGradient id={`${uid}-crew`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffe8cc" />
            <stop offset="100%" stopColor="#f5b87a" />
          </linearGradient>
          <linearGradient id={`${uid}-crew2`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#b8e4f8" />
            <stop offset="100%" stopColor="#5aa8d8" />
          </linearGradient>
          <linearGradient id={`${uid}-bubble`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#e8f5e9" />
            <stop offset="100%" stopColor="#a5d6a7" />
          </linearGradient>
          <linearGradient id={`${uid}-gold`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffe082" />
            <stop offset="100%" stopColor="#c9a227" />
          </linearGradient>
        </defs>
        {art()}
      </svg>
    </BadgeShell>
  );
}

export function NavBadgeIcon({ kind, active = false, size = 34 }: Props) {
  if (kind === "home") {
    return (
      <BadgeShell active={active} size={size} className="nav-badge--home">
        <BrandPeachIcon size={Math.round(size * 0.82)} animated={active} />
      </BadgeShell>
    );
  }

  if (kind === "game") {
    return (
      <BadgeShell active={active} size={size} className="nav-badge--game">
        <BirdBadge birdId="classic" size={size} className="nav-badge__bird" />
      </BadgeShell>
    );
  }

  return <NavSvgBadge kind={kind} active={active} size={size} />;
}
