import { useId, type CSSProperties } from "react";
import type { CREW_LEVELS } from "../lib/progressLevels";

export type LevelTitleKey = (typeof CREW_LEVELS)[number]["titleKey"];

type Props = {
  titleKey: LevelTitleKey | string;
  size?: number;
  active?: boolean;
  dimmed?: boolean;
};

function BadgeDefs({ uid }: { uid: string }) {
  const p = (name: string) => `${uid}-${name}`;
  return (
    <defs>
      <linearGradient id={p("sky")} x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#f8fcfa" />
        <stop offset="100%" stopColor="#d8ebe2" />
      </linearGradient>
      <linearGradient id={p("warm")} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ffe8cc" />
        <stop offset="100%" stopColor="#f5b87a" />
      </linearGradient>
      <linearGradient id={p("leaf")} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#b8f0c8" />
        <stop offset="100%" stopColor="#5cb87a" />
      </linearGradient>
      <linearGradient id={p("water")} x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#b8e4f8" />
        <stop offset="100%" stopColor="#5aa8d8" />
      </linearGradient>
      <linearGradient id={p("gold")} x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#ffe9a8" />
        <stop offset="55%" stopColor="#f5c842" />
        <stop offset="100%" stopColor="#d4a020" />
      </linearGradient>
      <linearGradient id={p("plate")} x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#fffaf5" />
        <stop offset="100%" stopColor="#e8ddd2" />
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

function LevelArt({ titleKey, uid }: { titleKey: string; uid: string }) {
  const g = (name: string) => `url(#${uid}-${name})`;
  const f = `${uid}-soft`;

  switch (titleKey) {
    case "hatchling":
      return (
        <g filter={`url(#${f})`}>
          <ellipse className="level-badge__nest" cx="40" cy="52" rx="22" ry="7" />
          <path className="level-badge__nest-straw" d="M22 50 Q28 46 34 50 M46 50 Q52 46 58 50" />
          <ellipse className="level-badge__egg" cx="40" cy="36" rx="15" ry="19" fill={g("warm")} />
          <ellipse className="level-badge__egg-shine" cx="34" cy="30" rx="5" ry="7" fill={g("glow")} opacity="0.55" />
          <path className="level-badge__egg-speck" d="M36 34 a1.2 1.2 0 1 0 0.1 0 M44 38 a1 1 0 1 0 0.1 0 M38 42 a0.8 0.8 0 1 0 0.1 0" />
          <path className="level-badge__crack" d="M35 26 L38 34 L36 40 M45 26 L42 33 L44 39" />
          <path className="level-badge__crack-glow" d="M39 24 Q40 30 39 36" opacity="0.5" />
        </g>
      );
    case "sprout":
      return (
        <g filter={`url(#${f})`}>
          <ellipse className="level-badge__soil" cx="40" cy="52" rx="18" ry="6" />
          <path className="level-badge__soil-line" d="M28 52 Q34 50 40 52 Q46 54 52 52" />
          <path className="level-badge__stem" d="M40 52 C40 44 40 36 40 28" />
          <path className="level-badge__leaf-vein" d="M30 30 L40 28 L50 30" />
          <ellipse className="level-badge__leaf level-badge__leaf--l" cx="28" cy="30" rx="12" ry="7" fill={g("leaf")} transform="rotate(-32 28 30)" />
          <ellipse className="level-badge__leaf level-badge__leaf--r" cx="52" cy="30" rx="12" ry="7" fill={g("leaf")} transform="rotate(32 52 30)" />
          <circle className="level-badge__bud" cx="40" cy="24" r="4" fill={g("warm")} />
        </g>
      );
    case "snacker":
      return (
        <g filter={`url(#${f})`}>
          <ellipse className="level-badge__bowl" cx="40" cy="46" rx="22" ry="8" fill={g("plate")} />
          <path className="level-badge__bowl-rim" d="M18 44 Q40 36 62 44" />
          <circle className="level-badge__berry" cx="32" cy="42" r="3.5" />
          <circle className="level-badge__berry" cx="40" cy="40" r="4" />
          <circle className="level-badge__berry" cx="48" cy="42" r="3" />
          <ellipse className="level-badge__leaf-bit" cx="36" cy="44" rx="4" ry="2" fill={g("leaf")} transform="rotate(-20 36 44)" />
          <circle className="level-badge__lens" cx="56" cy="22" r="9" fill={g("water")} />
          <circle className="level-badge__lens-inner" cx="56" cy="22" r="5" />
          <path className="level-badge__magnifier" d="M62 28 L68 34" />
          <circle className="level-badge__lens-glint" cx="53" cy="19" r="2" fill="#fff" opacity="0.7" />
        </g>
      );
    case "logger":
      return (
        <g filter={`url(#${f})`}>
          <rect className="level-badge__journal" x="22" y="14" width="30" height="42" rx="4" fill={g("sky")} />
          <path className="level-badge__journal-spine" d="M22 18 v34" />
          <path className="level-badge__journal-line" d="M28 26 h18 M28 33 h14 M28 40 h10" />
          <path className="level-badge__check" d="M30 48 l3 3 7-8" />
          <rect className="level-badge__camera-body" x="48" y="18" width="16" height="12" rx="2" />
          <circle className="level-badge__lens" cx="56" cy="24" r="5" fill={g("water")} />
          <circle className="level-badge__lens-inner" cx="56" cy="24" r="2.5" />
          <rect className="level-badge__camera-flash" x="50" y="20" width="3" height="2" rx="0.5" />
        </g>
      );
    case "regular":
      return (
        <g filter={`url(#${f})`}>
          <rect className="level-badge__cal" x="20" y="16" width="40" height="38" rx="5" fill={g("sky")} />
          <path className="level-badge__cal-line" d="M20 26 h40" />
          <path className="level-badge__cal-ring" d="M28 16 v6 M40 16 v6 M52 16 v6" />
          <circle className="level-badge__cal-dot" cx="30" cy="34" r="2.5" />
          <circle className="level-badge__cal-dot level-badge__cal-dot--on" cx="40" cy="34" r="2.5" />
          <circle className="level-badge__cal-dot level-badge__cal-dot--on" cx="50" cy="34" r="2.5" />
          <circle className="level-badge__cal-dot" cx="30" cy="44" r="2.5" />
          <circle className="level-badge__cal-dot level-badge__cal-dot--on" cx="40" cy="44" r="2.5" />
          <circle className="level-badge__cal-dot" cx="50" cy="44" r="2.5" />
          <path className="level-badge__rhythm" d="M14 52 Q22 48 30 52 T46 52 T62 52" />
        </g>
      );
    case "balanced":
      return (
        <g filter={`url(#${f})`}>
          <path className="level-badge__scale-stand" d="M40 28 V54 M34 54 h12" />
          <path className="level-badge__scale-beam" d="M16 30 h48" />
          <path className="level-badge__scale-chain" d="M22 30 v4 M58 30 v4" />
          <ellipse className="level-badge__scale-pan" cx="22" cy="36" rx="11" ry="4" fill={g("plate")} />
          <ellipse className="level-badge__scale-pan" cx="58" cy="36" rx="11" ry="4" fill={g("plate")} />
          <circle className="level-badge__fruit" cx="20" cy="33" r="4" />
          <ellipse className="level-badge__leaf-bit" cx="26" cy="34" rx="3" ry="2" fill={g("leaf")} />
          <circle className="level-badge__fruit level-badge__fruit--g" cx="58" cy="33" r="4" />
          <ellipse className="level-badge__grain" cx="54" cy="34" rx="3" ry="2" fill={g("warm")} />
        </g>
      );
    case "protein":
      return (
        <g filter={`url(#${f})`}>
          <ellipse className="level-badge__plate" cx="40" cy="48" rx="24" ry="8" fill={g("plate")} />
          <path className="level-badge__plate-rim" d="M16 46 Q40 38 64 46" />
          <path className="level-badge__protein-main" d="M28 42 Q40 34 52 42 Q48 48 40 50 Q32 48 28 42z" fill={g("warm")} />
          <path className="level-badge__protein-grill" d="M32 40 Q40 38 48 40 M30 44 Q40 42 50 44" />
          <ellipse className="level-badge__greens" cx="34" cy="44" rx="5" ry="3" fill={g("leaf")} transform="rotate(-15 34 44)" />
          <ellipse className="level-badge__greens" cx="48" cy="43" rx="4" ry="2.5" fill={g("leaf")} transform="rotate(20 48 43)" />
          <circle className="level-badge__garnish" cx="52" cy="40" r="2" fill="#f472b6" />
        </g>
      );
    case "crewmate":
      return (
        <g filter={`url(#${f})`}>
          <path className="level-badge__crew-arc" d="M18 50 Q40 58 62 50" />
          <circle className="level-badge__crew" cx="26" cy="34" r="8" fill={g("water")} />
          <circle className="level-badge__crew" cx="54" cy="34" r="8" fill={g("water")} />
          <circle className="level-badge__crew level-badge__crew--lead" cx="40" cy="26" r="9" fill={g("leaf")} />
          <path className="level-badge__crew-shoulder" d="M18 44 Q26 38 34 44 M46 44 Q54 38 62 44" />
          <path className="level-badge__link-heart" d="M40 40 C38 37 34 37 34 40 C34 44 40 48 40 48 C40 48 46 44 46 40 C46 37 42 37 40 40z" fill="#f4a0a8" opacity="0.85" />
        </g>
      );
    case "chef":
      return (
        <g filter={`url(#${f})`}>
          <path className="level-badge__toque" d="M26 36 C28 18 36 12 40 12 C44 12 52 18 54 36 Z" fill="#fffaf5" />
          <path className="level-badge__toque-fold" d="M30 22 Q40 16 50 22 M32 28 Q40 24 48 28 M34 34 Q40 30 46 34" />
          <rect className="level-badge__toque-band" x="26" y="36" width="28" height="8" rx="2" fill={g("sky")} />
          <ellipse className="level-badge__pot" cx="24" cy="50" rx="10" ry="5" fill={g("plate")} />
          <path className="level-badge__pot-rim" d="M14 48 h20" />
          <path className="level-badge__spoon" d="M52 50 C56 42 58 32 60 24" />
          <ellipse className="level-badge__spoon-head" cx="60" cy="22" rx="4" ry="5" fill={g("warm")} />
        </g>
      );
    case "hawk":
      return (
        <g filter={`url(#${f})`}>
          <path className="level-badge__brow" d="M24 30 Q40 22 56 30" />
          <ellipse className="level-badge__eye-white" cx="40" cy="36" rx="17" ry="11" fill="#fff" />
          <circle className="level-badge__eye-iris" cx="40" cy="36" r="8" fill={g("water")} />
          <circle className="level-badge__eye-pupil" cx="40" cy="36" r="3.5" />
          <circle className="level-badge__eye-glint" cx="37" cy="34" r="2" fill="#fff" opacity="0.85" />
          <ellipse className="level-badge__leaf" cx="58" cy="20" rx="9" ry="5" fill={g("leaf")} transform="rotate(28 58 20)" />
          <path className="level-badge__leaf-vein" d="M54 20 L62 20" transform="rotate(28 58 20)" />
        </g>
      );
    case "streaker":
      return (
        <g filter={`url(#${f})`}>
          <path className="level-badge__wave" d="M12 50 Q24 42 36 50 T60 50" />
          <path className="level-badge__wave" d="M12 54 Q28 46 40 54 T68 54" opacity="0.45" />
          <path className="level-badge__flame-outer" d="M40 16 C32 24 26 32 26 40a14 14 0 0 0 28 0c0-6-4-14-14-24z" fill="#ffb07a" />
          <path className="level-badge__flame-mid" d="M40 22 C35 28 32 34 32 40a10 10 0 0 0 16 0c0-4-2-10-8-18z" fill="#ffcc66" />
          <path className="level-badge__flame-core" d="M40 30 C38 34 36 38 36 40a6 6 0 0 0 8 0c0-2-1-6-4-10z" fill="#fff5d6" />
        </g>
      );
    case "captain":
      return (
        <g filter={`url(#${f})`}>
          <circle className="level-badge__wheel" cx="40" cy="36" r="17" fill={g("water")} />
          <circle className="level-badge__wheel-rim" cx="40" cy="36" r="14" />
          <path className="level-badge__wheel-spoke" d="M40 19 v34 M23 36 h34 M27 23 l26 26 M53 23 L27 49" />
          <circle className="level-badge__wheel-hub" cx="40" cy="36" r="5" fill={g("gold")} />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
            <circle
              key={deg}
              className="level-badge__wheel-knob"
              cx={40 + 14 * Math.cos((deg * Math.PI) / 180)}
              cy={36 + 14 * Math.sin((deg * Math.PI) / 180)}
              r="2.2"
            />
          ))}
        </g>
      );
    case "champion":
      return (
        <g filter={`url(#${f})`}>
          <path className="level-badge__trophy-base" d="M28 50 h24 v6 H28z" fill={g("gold")} />
          <path className="level-badge__trophy-stem" d="M36 42 h8 v8" fill={g("gold")} />
          <path className="level-badge__trophy-cup" d="M30 18 h20 v24 a10 10 0 0 1-20 0z" fill={g("gold")} />
          <path className="level-badge__trophy-shine" d="M34 22 v16" opacity="0.45" />
          <path className="level-badge__trophy-handle" d="M30 24 H22 a5 5 0 0 0 0 10 h8 M50 24 h8 a5 5 0 0 1 0 10 h-8" />
          <path className="level-badge__trophy-star" d="M40 26 L41.5 30 L46 30 L42.5 32.5 L44 37 L40 34.5 L36 37 L37.5 32.5 L34 30 L38.5 30 Z" fill="#fff8e8" />
        </g>
      );
    case "master":
      return (
        <g filter={`url(#${f})`}>
          <path className="level-badge__book" d="M22 16 h16 v40 H22 a5 5 0 0 1-5-5 V21 a5 5 0 0 1 5-5z" fill={g("leaf")} />
          <path className="level-badge__book" d="M58 16 H42 v40 h16 a5 5 0 0 0 5-5 V21 a5 5 0 0 0-5-5z" fill={g("water")} />
          <path className="level-badge__book-line" d="M26 26 h8 M26 32 h6 M48 26 h8 M48 32 h6" />
          <path className="level-badge__star" d="M40 22 L42 28 L48 28 L43 32 L45 38 L40 35 L35 38 L37 32 L32 28 L38 28 Z" fill={g("gold")} />
          <circle className="level-badge__star-glow" cx="40" cy="30" r="10" fill={g("glow")} opacity="0.35" />
        </g>
      );
    case "legend":
      return (
        <g filter={`url(#${f})`}>
          <rect className="level-badge__crown-base" x="22" y="44" width="36" height="8" rx="2" fill={g("gold")} />
          <path className="level-badge__crown" d="M22 44 L28 22 L36 34 L40 18 L44 34 L52 22 L58 44 Z" fill={g("gold")} />
          <circle className="level-badge__gem" cx="40" cy="32" r="3.5" fill="#f472b6" />
          <circle className="level-badge__gem" cx="28" cy="36" r="2.5" fill="#60a5fa" />
          <circle className="level-badge__gem" cx="52" cy="36" r="2.5" fill="#4ade80" />
          <path className="level-badge__crown-engrave" d="M30 40 Q40 36 50 40" />
          <circle className="level-badge__spark" cx="18" cy="20" r="2" fill="#ffe9a8" opacity="0.8" />
          <circle className="level-badge__spark" cx="62" cy="18" r="1.5" fill="#ffe9a8" opacity="0.6" />
        </g>
      );
    default:
      return <circle className="level-badge__fallback" cx="40" cy="36" r="14" fill={g("leaf")} />;
  }
}

/** Illustrated crew level badge for the progress card. */
export function LevelBadgeIcon({
  titleKey,
  size = 168,
  active = false,
  dimmed = false,
}: Props) {
  const uid = useId().replace(/:/g, "");
  const rootClass = [
    "level-badge",
    `level-badge--${titleKey}`,
    active ? "level-badge--active" : "",
    dimmed ? "level-badge--dimmed" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span
      className={rootClass}
      style={{ "--level-badge-size": `${size}px` } as CSSProperties}
      aria-hidden
    >
      <span className="level-badge__aura" />
      <svg
        className="level-badge__svg"
        viewBox="0 0 80 64"
        xmlns="http://www.w3.org/2000/svg"
        role="presentation"
      >
        <BadgeDefs uid={uid} />
        <LevelArt titleKey={titleKey} uid={uid} />
      </svg>
    </span>
  );
}
