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
  | "report"
  | "trends"
  | "coach"
  | "referrals"
  | "business"
  | "more"
  | "features"
  | "settings";

type Props = {
  kind: NavBadgeKind;
  active?: boolean;
  /** Idle motion (home grid, more sheet) even when not the active route */
  animated?: boolean;
  size?: number;
};

function BadgeShell({
  kind,
  active,
  animated,
  size,
  children,
  className = "",
}: {
  kind: NavBadgeKind;
  active?: boolean;
  animated?: boolean;
  size: number;
  children: ReactNode;
  className?: string;
}) {
  const rootClass = [
    "nav-badge",
    `nav-badge--${kind}`,
    active ? "nav-badge--active" : "",
    animated && !active ? "nav-badge--live" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={rootClass} style={{ "--nav-badge-size": `${size}px` } as CSSProperties}>
      <span className="nav-badge__halo" aria-hidden />
      <span className="nav-badge__ring" aria-hidden />
      <span className="nav-badge__shine" aria-hidden />
      {children}
    </span>
  );
}

function NavSvgBadge({
  kind,
  active,
  animated,
  size = 46,
}: {
  kind: Exclude<NavBadgeKind, "home" | "game">;
  active?: boolean;
  animated?: boolean;
  size?: number;
}) {
  const uid = useId().replace(/:/g, "");
  const g = (name: string) => `url(#${uid}-${name})`;

  function bg(fill: string) {
    return <rect className="nav-badge__bg" x="4" y="4" width="40" height="40" rx="12" fill={fill} />;
  }

  function art() {
    switch (kind) {
      case "food":
        return (
          <>
            {bg(g("foodBg"))}
            <ellipse cx="24" cy="33" rx="12" ry="3" fill="#000" opacity="0.1" />
            <ellipse cx="24" cy="29" rx="11" ry="3" fill={g("plate")} />
            <path className="nav-badge__meal" d="M13 28 Q24 20 35 28" fill={g("salad")} />
            <circle cx="19" cy="25" r="3.2" fill="#ef5350" />
            <circle cx="27" cy="24" r="2.8" fill="#ffca28" />
            <circle className="nav-badge__steam" cx="18" cy="15" r="2.2" fill="#fff" opacity="0.85" />
            <circle className="nav-badge__steam nav-badge__steam--2" cx="25" cy="12" r="1.8" fill="#fff" opacity="0.7" />
            <rect className="nav-badge__cam-mini" x="30" y="14" width="10" height="8" rx="2" fill="#455a64" />
            <circle cx="35" cy="18" r="2.5" fill="#29b6f6" />
          </>
        );
      case "guide":
        return (
          <>
            {bg(g("leafBg"))}
            <path className="nav-badge__leaf" d="M14 38 Q24 10 34 38 Z" fill={g("leaf")} />
            <path d="M24 15 Q26 28 24 38" stroke="#2e7d32" strokeWidth="1.3" opacity="0.5" />
            <circle className="nav-badge__spark" cx="17" cy="21" r="2" fill="#fff9c4" />
            <circle className="nav-badge__spark nav-badge__spark--2" cx="31" cy="19" r="1.5" fill="#c8e6c9" />
            <path d="M10 36 h28" stroke="#81c784" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
          </>
        );
      case "quiz":
        return (
          <>
            {bg(g("quizBg"))}
            <rect x="11" y="13" width="26" height="24" rx="5" fill={g("card")} />
            <text className="nav-badge__quiz-mark" x="24" y="30" textAnchor="middle" fontSize="15" fontWeight="800" fill="#f57f17">
              ?
            </text>
            <circle className="nav-badge__spark" cx="35" cy="15" r="2.2" fill="#ffeb3b" />
            <circle className="nav-badge__dot" cx="15" cy="16" r="1.6" fill="#ff9800" />
          </>
        );
      case "team":
        return (
          <>
            {bg(g("teamBg"))}
            <circle className="nav-badge__crew-head" cx="17" cy="21" r="6.5" fill={g("crew")} />
            <circle className="nav-badge__crew-head nav-badge__crew-head--2" cx="31" cy="21" r="6.5" fill={g("crew2")} />
            <path d="M9 37 Q24 29 39 37" fill={g("crew")} opacity="0.9" />
            <path className="nav-badge__heart" d="M24 12 C22 9 18 9 18 13 C18 9 14 9 14 13 C14 17 24 22 24 22 C24 22 34 17 34 13 C34 9 30 9 30 13 C30 9 26 9 24 12Z" fill="#f48fb1" opacity="0.85" />
          </>
        );
      case "chat":
        return (
          <>
            {bg(g("chatBg"))}
            <path d="M9 15 h30 a4 4 0 0 1 4 4 v11 a4 4 0 0 1-4 4 H19 l-7 7 v-7 h-3 a4 4 0 0 1-4-4 V19 a4 4 0 0 1 4-4z" fill={g("bubble")} />
            <circle className="nav-badge__dot" cx="17" cy="26" r="1.7" fill="#fff" />
            <circle className="nav-badge__dot nav-badge__dot--2" cx="24" cy="26" r="1.7" fill="#fff" />
            <circle className="nav-badge__dot nav-badge__dot--3" cx="31" cy="26" r="1.7" fill="#fff" />
            <circle className="nav-badge__spark" cx="36" cy="14" r="2" fill="#69f0ae" />
          </>
        );
      case "rank":
        return (
          <>
            {bg(g("goldBg"))}
            <path d="M13 35 h22 v-4 H13z" fill={g("gold")} />
            <path className="nav-badge__podium" d="M17 35 V22 l7-9 7 9 v13" fill={g("gold")} />
            <circle className="nav-badge__spark" cx="24" cy="17" r="3" fill="#fff8e1" />
            <text x="24" y="31" textAnchor="middle" fontSize="8" fontWeight="800" fill="#f57f17">1</text>
          </>
        );
      case "prizes":
        return (
          <>
            {bg(g("prizeBg"))}
            <path
              className="nav-badge__star"
              d="M24 9 l3 7.2 L35 17 l-5.8 4.6 L31 30 24 25 17 30 l1.8-8.4 L13 17 l8-0.8 Z"
              fill={g("gold")}
            />
            <circle className="nav-badge__spark" cx="34" cy="13" r="2" fill="#fff59d" />
            <circle className="nav-badge__spark nav-badge__spark--2" cx="14" cy="15" r="1.6" fill="#ffab91" />
          </>
        );
      case "report":
        return (
          <>
            {bg(g("reportBg"))}
            <rect x="11" y="11" width="26" height="28" rx="4" fill={g("card")} />
            <rect className="nav-badge__bar nav-badge__bar--1" x="15" y="28" width="4.5" height="8" rx="1" fill="#66bb6a" />
            <rect className="nav-badge__bar nav-badge__bar--2" x="21.5" y="22" width="4.5" height="14" rx="1" fill="#ffa726" />
            <rect className="nav-badge__bar nav-badge__bar--3" x="28" y="17" width="4.5" height="19" rx="1" fill="#42a5f5" />
            <path d="M14 17 h20" stroke="#8d6e63" strokeWidth="1.2" opacity="0.45" />
          </>
        );
      case "trends":
        return (
          <>
            {bg(g("trendBg"))}
            <path className="nav-badge__trend-line" d="M12 32 L20 26 L27 28 L36 16" fill="none" stroke="#42a5f5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="36" cy="16" r="2.5" fill="#29b6f6" />
            <path className="nav-badge__trend-arrow" d="M32 16 h6 M34 13 l4 3 -4 3" stroke="#1565c0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <circle className="nav-badge__spark" cx="14" cy="14" r="2" fill="#81d4fa" />
          </>
        );
      case "coach":
        return (
          <>
            {bg(g("coachBg"))}
            <circle cx="24" cy="24" r="15" fill={g("coach")} />
            <path d="M13 31 Q24 23 35 31" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" opacity="0.9" />
            <circle className="nav-badge__spark" cx="33" cy="15" r="2.8" fill="#ede9fe" />
            <circle className="nav-badge__spark nav-badge__spark--2" cx="15" cy="17" r="1.8" fill="#fff" />
            <text className="nav-badge__ai-text" x="24" y="28" textAnchor="middle" fontSize="11" fontWeight="800" fill="#5b21b6">
              AI
            </text>
          </>
        );
      case "referrals":
        return (
          <>
            {bg(g("giftBg"))}
            <rect className="nav-badge__gift-box" x="14" y="20" width="20" height="16" rx="3" fill="#ff8a65" />
            <rect x="14" y="26" width="20" height="4" fill="#f4511e" />
            <rect x="22" y="18" width="4" height="20" fill="#ffcc80" />
            <path className="nav-badge__gift-bow" d="M24 18 C20 14 14 14 16 20 C14 14 10 16 14 20 Z" fill="#f48fb1" />
            <path className="nav-badge__gift-bow nav-badge__gift-bow--2" d="M24 18 C28 14 34 14 32 20 C34 14 38 16 34 20 Z" fill="#f48fb1" />
            <circle className="nav-badge__spark" cx="34" cy="14" r="2" fill="#ffeb3b" />
          </>
        );
      case "business":
        return (
          <>
            {bg(g("bizBg"))}
            <rect x="13" y="18" width="22" height="18" rx="2" fill="#90a4ae" />
            <rect x="16" y="22" width="4" height="4" rx="0.5" fill="#e3f2fd" />
            <rect x="22" y="22" width="4" height="4" rx="0.5" fill="#e3f2fd" />
            <rect x="28" y="22" width="4" height="4" rx="0.5" fill="#e3f2fd" />
            <rect x="20" y="14" width="8" height="6" fill="#78909c" />
            <path className="nav-badge__leaf" d="M30 12 Q34 8 36 12 Q34 16 30 12" fill="#66bb6a" />
          </>
        );
      case "more":
        return (
          <>
            {bg(g("moreBg"))}
            <circle className="nav-badge__dot" cx="17" cy="24" r="3" fill="#66bb6a" />
            <circle className="nav-badge__dot nav-badge__dot--2" cx="24" cy="24" r="3" fill="#ffa726" />
            <circle className="nav-badge__dot nav-badge__dot--3" cx="31" cy="24" r="3" fill="#42a5f5" />
          </>
        );
      case "features":
        return (
          <>
            {bg(g("featBg"))}
            <path
              className="nav-badge__star"
              d="M24 9 l3.2 7.4 L35 17 l-6 4.6 L31 30 24 25 17 30 l2-8.4 L13 17 l8.2-0.6 Z"
              fill={g("gold")}
            />
            <circle cx="24" cy="22" r="4.5" fill="#fff" opacity="0.5" />
            <circle className="nav-badge__spark" cx="34" cy="12" r="2" fill="#ffeb3b" />
          </>
        );
      case "settings":
        return (
          <>
            {bg(g("settingsBg"))}
            <circle cx="24" cy="24" r="11" fill={g("card")} />
            <circle cx="24" cy="24" r="5" fill="#66bb6a" />
            <g className="nav-badge__gear">
              <path d="M24 10 v5 M24 33 v5 M10 24 h5 M33 24 h5" stroke="#78909c" strokeWidth="2.2" strokeLinecap="round" />
              <path d="M15 15 l3.5 3.5 M29.5 29.5 l3.5 3.5 M33 15 l-3.5 3.5 M18.5 29.5 l-3.5 3.5" stroke="#78909c" strokeWidth="2" strokeLinecap="round" />
            </g>
          </>
        );
      default:
        return null;
    }
  }

  return (
    <BadgeShell kind={kind} active={active} animated={animated} size={size}>
      <svg className="nav-badge__svg" viewBox="0 0 48 48" aria-hidden>
        <defs>
          <linearGradient id={`${uid}-foodBg`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fff8e1" />
            <stop offset="100%" stopColor="#ffccbc" />
          </linearGradient>
          <linearGradient id={`${uid}-leafBg`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e8f5e9" />
            <stop offset="100%" stopColor="#a5d6a7" />
          </linearGradient>
          <linearGradient id={`${uid}-quizBg`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fffde7" />
            <stop offset="100%" stopColor="#ffe082" />
          </linearGradient>
          <linearGradient id={`${uid}-teamBg`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fce4ec" />
            <stop offset="100%" stopColor="#b3e5fc" />
          </linearGradient>
          <linearGradient id={`${uid}-chatBg`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e8f5e9" />
            <stop offset="100%" stopColor="#c8e6c9" />
          </linearGradient>
          <linearGradient id={`${uid}-goldBg`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fff8e1" />
            <stop offset="100%" stopColor="#ffecb3" />
          </linearGradient>
          <linearGradient id={`${uid}-prizeBg`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fff9c4" />
            <stop offset="100%" stopColor="#ffd54f" />
          </linearGradient>
          <linearGradient id={`${uid}-reportBg`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e3f2fd" />
            <stop offset="100%" stopColor="#bbdefb" />
          </linearGradient>
          <linearGradient id={`${uid}-trendBg`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e1f5fe" />
            <stop offset="100%" stopColor="#b3e5fc" />
          </linearGradient>
          <linearGradient id={`${uid}-coachBg`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f3e8ff" />
            <stop offset="100%" stopColor="#ddd6fe" />
          </linearGradient>
          <linearGradient id={`${uid}-giftBg`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fce4ec" />
            <stop offset="100%" stopColor="#f8bbd0" />
          </linearGradient>
          <linearGradient id={`${uid}-bizBg`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#eceff1" />
            <stop offset="100%" stopColor="#cfd8dc" />
          </linearGradient>
          <linearGradient id={`${uid}-moreBg`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f1f8e9" />
            <stop offset="100%" stopColor="#dcedc8" />
          </linearGradient>
          <linearGradient id={`${uid}-featBg`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e8eaf6" />
            <stop offset="100%" stopColor="#c5cae9" />
          </linearGradient>
          <linearGradient id={`${uid}-settingsBg`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f5f5f5" />
            <stop offset="100%" stopColor="#e0e0e0" />
          </linearGradient>
          <linearGradient id={`${uid}-plate`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fffaf5" />
            <stop offset="100%" stopColor="#e8ddd2" />
          </linearGradient>
          <linearGradient id={`${uid}-salad`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#c8e6c9" />
            <stop offset="100%" stopColor="#66bb6a" />
          </linearGradient>
          <linearGradient id={`${uid}-leaf`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a5d6a7" />
            <stop offset="100%" stopColor="#43a047" />
          </linearGradient>
          <linearGradient id={`${uid}-card`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fff" />
            <stop offset="100%" stopColor="#f5f5f5" />
          </linearGradient>
          <linearGradient id={`${uid}-crew`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffccbc" />
            <stop offset="100%" stopColor="#ff8a65" />
          </linearGradient>
          <linearGradient id={`${uid}-crew2`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#b3e5fc" />
            <stop offset="100%" stopColor="#4fc3f7" />
          </linearGradient>
          <linearGradient id={`${uid}-bubble`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#c8e6c9" />
            <stop offset="100%" stopColor="#81c784" />
          </linearGradient>
          <linearGradient id={`${uid}-gold`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffe082" />
            <stop offset="100%" stopColor="#ffb300" />
          </linearGradient>
          <linearGradient id={`${uid}-coach`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e9d5ff" />
            <stop offset="100%" stopColor="#a78bfa" />
          </linearGradient>
        </defs>
        {art()}
      </svg>
    </BadgeShell>
  );
}

export function NavBadgeIcon({ kind, active = false, animated = false, size = 46 }: Props) {
  if (kind === "home") {
    return (
      <BadgeShell kind={kind} active={active} animated={animated} size={size} className="nav-badge--home">
        <BrandPeachIcon size={Math.round(size * 0.82)} animated={active || animated} />
      </BadgeShell>
    );
  }

  if (kind === "game") {
    return (
      <BadgeShell kind={kind} active={active} animated={animated} size={size} className="nav-badge--game">
        <BirdBadge birdId="classic" size={size} className="nav-badge__bird" />
      </BadgeShell>
    );
  }

  return <NavSvgBadge kind={kind} active={active} animated={animated} size={size} />;
}
