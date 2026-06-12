import { useId, type CSSProperties } from "react";

type Props = {
  achievementId: string;
  unlocked?: boolean;
  size?: number;
};

function BadgeDefs({ uid }: { uid: string }) {
  const p = (name: string) => `${uid}-${name}`;
  return (
    <defs>
      <linearGradient id={p("gold")} x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#ffe9a8" />
        <stop offset="55%" stopColor="#f5c842" />
        <stop offset="100%" stopColor="#d4a020" />
      </linearGradient>
      <linearGradient id={p("fire")} x1="0%" y1="100%" x2="0%" y2="0%">
        <stop offset="0%" stopColor="#ff8a50" />
        <stop offset="50%" stopColor="#ffb347" />
        <stop offset="100%" stopColor="#fff0c8" />
      </linearGradient>
      <linearGradient id={p("leaf")} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#b8f0c8" />
        <stop offset="100%" stopColor="#5cb87a" />
      </linearGradient>
      <linearGradient id={p("water")} x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#b8e4f8" />
        <stop offset="100%" stopColor="#5aa8d8" />
      </linearGradient>
      <linearGradient id={p("plate")} x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#fffaf5" />
        <stop offset="100%" stopColor="#e8ddd2" />
      </linearGradient>
      <linearGradient id={p("gem")} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#c8f0ff" />
        <stop offset="45%" stopColor="#7dd3fc" />
        <stop offset="100%" stopColor="#38bdf8" />
      </linearGradient>
      <radialGradient id={p("glow")} cx="50%" cy="35%" r="55%">
        <stop offset="0%" stopColor="#fff" stopOpacity="0.9" />
        <stop offset="100%" stopColor="#fff" stopOpacity="0" />
      </radialGradient>
      <filter id={p("soft")} x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="1.5" stdDeviation="1.2" floodColor="#1a2820" floodOpacity="0.22" />
      </filter>
    </defs>
  );
}

function AchievementArt({ id, uid }: { id: string; uid: string }) {
  const g = (name: string) => `url(#${uid}-${name})`;
  const f = `${uid}-soft`;

  switch (id) {
    case "first_meal":
      return (
        <g filter={`url(#${f})`}>
          <ellipse className="ach-badge__plate" cx="40" cy="46" rx="24" ry="9" fill={g("plate")} />
          <path className="ach-badge__plate-rim" d="M16 44 Q40 36 64 44" />
          <circle className="ach-badge__food" cx="34" cy="42" r="5" />
          <circle className="ach-badge__food ach-badge__food--g" cx="44" cy="40" r="6" />
          <ellipse className="ach-badge__leaf" cx="50" cy="43" rx="5" ry="3" fill={g("leaf")} transform="rotate(18 50 43)" />
          <path className="ach-badge__steam ach-badge__steam--1" d="M30 28 Q32 16 34 28" />
          <path className="ach-badge__steam ach-badge__steam--2" d="M40 24 Q42 10 44 24" />
          <path className="ach-badge__steam ach-badge__steam--3" d="M50 28 Q52 16 54 28" />
          <path className="ach-badge__fork" d="M58 18 v20 M55 18 v12 M61 18 v12 M58 38 v8" />
        </g>
      );
    case "streak_7":
      return (
        <g filter={`url(#${f})`}>
          <path className="ach-badge__flame-outer" d="M40 14 C30 26 24 34 24 42a16 16 0 0 0 32 0c0-8-6-16-16-28z" fill={g("fire")} />
          <path className="ach-badge__flame-mid" d="M40 22 C34 30 30 36 30 42a10 10 0 0 0 20 0c0-4-2-10-10-20z" fill="#ffcc66" />
          <path className="ach-badge__flame-core" d="M40 32 C38 36 36 40 36 42a6 6 0 0 0 8 0c0-2-1-6-4-10z" fill="#fff5d6" />
          <text className="ach-badge__num" x="40" y="50" textAnchor="middle" fontSize="14" fontWeight="800" fill="#fff8e8">7</text>
        </g>
      );
    case "streak_30":
      return (
        <g filter={`url(#${f})`}>
          <path className="ach-badge__diamond" d="M40 14 L54 32 L40 50 L26 32 Z" fill={g("gem")} />
          <path className="ach-badge__diamond-shine" d="M34 24 L40 18 L46 24" />
          <path className="ach-badge__flame-mini" d="M40 26 C36 30 34 34 34 38a6 6 0 0 0 12 0c0-2-1-6-6-12z" fill={g("fire")} />
          <text className="ach-badge__num" x="40" y="44" textAnchor="middle" fontSize="11" fontWeight="800" fill="#fff">30</text>
        </g>
      );
    case "team_join":
      return (
        <g filter={`url(#${f})`}>
          <path className="ach-badge__crew-arc" d="M18 50 Q40 58 62 50" />
          <circle className="ach-badge__crew" cx="26" cy="34" r="8" fill={g("water")} />
          <circle className="ach-badge__crew" cx="54" cy="34" r="8" fill={g("water")} />
          <circle className="ach-badge__crew ach-badge__crew--lead" cx="40" cy="26" r="9" fill={g("leaf")} />
          <path className="ach-badge__link-heart" d="M40 40 C38 37 34 37 34 40 C34 44 40 48 40 48 C40 48 46 44 46 40 C46 37 42 37 40 40z" fill="#f4a0a8" />
        </g>
      );
    case "meals_50":
      return (
        <g filter={`url(#${f})`}>
          <rect className="ach-badge__cam-body" x="20" y="20" width="40" height="30" rx="5" />
          <circle className="ach-badge__lens" cx="40" cy="35" r="10" fill={g("water")} />
          <circle className="ach-badge__lens-inner" cx="40" cy="35" r="5" />
          <circle className="ach-badge__lens-glint" cx="37" cy="32" r="2" fill="#fff" opacity="0.75" />
          <rect className="ach-badge__cam-flash" x="24" y="24" width="6" height="4" rx="1" />
          <rect className="ach-badge__thumb ach-badge__thumb--1" x="52" y="48" width="10" height="8" rx="2" fill={g("plate")} />
          <rect className="ach-badge__thumb ach-badge__thumb--2" x="62" y="46" width="10" height="8" rx="2" fill={g("plate")} />
          <rect className="ach-badge__thumb ach-badge__thumb--3" x="57" y="52" width="10" height="8" rx="2" fill={g("plate")} />
          <text className="ach-badge__num ach-badge__num--sm" x="67" y="54" textAnchor="middle" fontSize="7" fontWeight="800" fill="#5a6a62">50</text>
        </g>
      );
    case "referral_1":
      return (
        <g filter={`url(#${f})`}>
          <path className="ach-badge__hand ach-badge__hand--l" d="M22 38 C18 34 16 28 20 24 C24 20 28 22 30 26 L34 36 Z" fill={g("plate")} />
          <path className="ach-badge__hand ach-badge__hand--r" d="M58 38 C62 34 64 28 60 24 C56 20 52 22 50 26 L46 36 Z" fill={g("plate")} />
          <path className="ach-badge__shake" d="M30 32 C36 28 44 28 50 32" />
          <circle className="ach-badge__spark" cx="40" cy="22" r="3" fill={g("gold")} />
          <path className="ach-badge__spark-ray" d="M40 14 v4 M40 26 v4 M32 22 h4 M44 22 h4" />
        </g>
      );
    case "bird_100":
      return (
        <g filter={`url(#${f})`}>
          <ellipse className="ach-badge__bird-body" cx="40" cy="42" rx="20" ry="15" fill={g("fire")} />
          <circle className="ach-badge__bird-eye" cx="48" cy="38" r="3" fill="#1a2e28" />
          <circle className="ach-badge__bird-eye-glint" cx="47" cy="37" r="1.2" fill="#fff" />
          <path className="ach-badge__bird-wing" d="M24 42 Q40 24 56 42" />
          <path className="ach-badge__bird-beak" d="M54 38 L62 40 L54 42 Z" fill={g("gold")} />
          <ellipse className="ach-badge__bird-tail" cx="22" cy="44" rx="6" ry="4" fill="#e8884a" transform="rotate(-20 22 44)" />
          <text className="ach-badge__num ach-badge__num--bird" x="40" y="56" textAnchor="middle" fontSize="10" fontWeight="800" fill="#fff8e8">100</text>
        </g>
      );
    case "challenge_done":
      return (
        <g filter={`url(#${f})`}>
          <path className="ach-badge__trophy-base" d="M28 50 h24 v6 H28z" fill={g("gold")} />
          <path className="ach-badge__trophy-stem" d="M36 42 h8 v8" fill={g("gold")} />
          <path className="ach-badge__trophy-cup" d="M30 18 h20 v24 a10 10 0 0 1-20 0z" fill={g("gold")} />
          <path className="ach-badge__trophy-handle" d="M30 24 H22 a5 5 0 0 0 0 10 h8 M50 24 h8 a5 5 0 0 1 0 10 h-8" />
          <path className="ach-badge__trophy-star" d="M40 26 L41.5 30 L46 30 L42.5 32.5 L44 37 L40 34.5 L36 37 L37.5 32.5 L34 30 L38.5 30 Z" fill="#fff8e8" />
          <circle className="ach-badge__spark" cx="18" cy="20" r="2" fill="#ffe9a8" />
          <circle className="ach-badge__spark ach-badge__spark--d" cx="62" cy="18" r="1.5" fill="#ffe9a8" />
        </g>
      );
    case "duel_win":
      return (
        <g filter={`url(#${f})`}>
          <path className="ach-badge__sword ach-badge__sword--l" d="M18 50 L34 18 L38 22 L22 54 Z" fill={g("water")} />
          <path className="ach-badge__sword ach-badge__sword--r" d="M62 50 L46 18 L42 22 L58 54 Z" fill={g("water")} />
          <path className="ach-badge__sword-guard" d="M30 28 h8 M42 28 h8" />
          <path className="ach-badge__sword-guard" d="M22 46 l6-6 M52 40 l6 6" />
          <circle className="ach-badge__clash" cx="40" cy="32" r="6" fill={g("glow")} opacity="0.5" />
          <path className="ach-badge__clash-star" d="M40 26 L41 30 L45 30 L42 32 L43 36 L40 34 L37 36 L38 32 L35 30 L39 30 Z" fill={g("gold")} />
        </g>
      );
    case "league_gold":
      return (
        <g filter={`url(#${f})`}>
          <path className="ach-badge__ribbon" d="M30 48 L34 58 L40 52 L46 58 L50 48 Z" fill="#e87888" />
          <circle className="ach-badge__medal" cx="40" cy="34" r="18" fill={g("gold")} />
          <circle className="ach-badge__medal-inner" cx="40" cy="34" r="13" />
          <text className="ach-badge__num" x="40" y="38" textAnchor="middle" fontSize="14" fontWeight="800" fill="#fff8e8">1</text>
          <path className="ach-badge__medal-shine" d="M34 28 v12" opacity="0.4" />
        </g>
      );
    default:
      return <circle className="ach-badge__fallback" cx="40" cy="36" r="14" fill={g("leaf")} />;
  }
}

/** Large illustrated achievement badge for the features screen. */
export function AchievementBadgeIcon({
  achievementId,
  unlocked = false,
  size = 140,
}: Props) {
  const uid = useId().replace(/:/g, "");
  const rootClass = [
    "ach-badge",
    `ach-badge--${achievementId.replace(/_/g, "-")}`,
    unlocked ? "ach-badge--unlocked" : "ach-badge--locked",
  ].join(" ");

  return (
    <span
      className={rootClass}
      style={{ "--ach-badge-size": `${size}px` } as CSSProperties}
      aria-hidden
    >
      <span className="ach-badge__ring" />
      <span className="ach-badge__shine" />
      <span className="ach-badge__aura" />
      <span className="ach-badge__particles" />
      <svg
        className="ach-badge__svg"
        viewBox="0 0 80 64"
        xmlns="http://www.w3.org/2000/svg"
        role="presentation"
      >
        <BadgeDefs uid={uid} />
        <AchievementArt id={achievementId} uid={uid} />
      </svg>
      {unlocked ? (
        <span className="ach-badge__check">✓</span>
      ) : (
        <span className="ach-badge__lock">🔒</span>
      )}
    </span>
  );
}
