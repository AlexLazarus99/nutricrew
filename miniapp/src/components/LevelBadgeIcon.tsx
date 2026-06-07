import type { CSSProperties } from "react";
import type { CREW_LEVELS } from "../lib/progressLevels";

export type LevelTitleKey = (typeof CREW_LEVELS)[number]["titleKey"];

type Props = {
  titleKey: LevelTitleKey | string;
  size?: number;
  active?: boolean;
  dimmed?: boolean;
};

function LevelArt({ titleKey }: { titleKey: string }) {
  switch (titleKey) {
    case "hatchling":
      return (
        <>
          <ellipse className="level-badge__egg" cx="40" cy="40" rx="18" ry="22" />
          <path className="level-badge__crack" d="M34 28 Q40 36 46 28" />
          <circle className="level-badge__spark level-badge__spark--a" cx="58" cy="22" r="2.5" />
        </>
      );
    case "sprout":
      return (
        <>
          <path className="level-badge__stem" d="M40 54 V32" />
          <ellipse className="level-badge__leaf level-badge__leaf--l" cx="30" cy="30" rx="10" ry="6" transform="rotate(-35 30 30)" />
          <ellipse className="level-badge__leaf level-badge__leaf--r" cx="50" cy="30" rx="10" ry="6" transform="rotate(35 50 30)" />
          <circle className="level-badge__soil" cx="40" cy="54" r="8" />
        </>
      );
    case "snacker":
      return (
        <>
          <ellipse className="level-badge__bowl" cx="40" cy="46" rx="20" ry="9" />
          <circle className="level-badge__berry" cx="34" cy="42" r="3" />
          <circle className="level-badge__berry" cx="44" cy="40" r="3" />
          <path className="level-badge__magnifier" d="M48 18 a10 10 0 1 0-14 14 l8 8" />
        </>
      );
    case "logger":
      return (
        <>
          <rect className="level-badge__journal" x="24" y="16" width="32" height="40" rx="5" />
          <path className="level-badge__journal-line" d="M30 28 h20 M30 36 h16 M30 44 h12" />
          <circle className="level-badge__lens" cx="54" cy="22" r="7" />
          <circle className="level-badge__lens-inner" cx="54" cy="22" r="3" />
        </>
      );
    case "regular":
      return (
        <>
          <rect className="level-badge__cal" x="22" y="18" width="36" height="34" rx="6" />
          <path className="level-badge__cal-line" d="M22 28 h36" />
          <circle className="level-badge__cal-dot level-badge__cal-dot--on" cx="32" cy="38" r="3" />
          <circle className="level-badge__cal-dot level-badge__cal-dot--on" cx="40" cy="38" r="3" />
          <circle className="level-badge__cal-dot" cx="48" cy="38" r="3" />
        </>
      );
    case "balanced":
      return (
        <>
          <path className="level-badge__scale-beam" d="M20 30 h40" />
          <path className="level-badge__scale-stand" d="M40 30 V50 M34 50 h12" />
          <ellipse className="level-badge__scale-pan level-badge__scale-pan--l" cx="26" cy="34" rx="10" ry="4" />
          <ellipse className="level-badge__scale-pan level-badge__scale-pan--r" cx="54" cy="34" rx="10" ry="4" />
          <circle className="level-badge__fruit" cx="24" cy="30" r="4" />
          <circle className="level-badge__fruit level-badge__fruit--g" cx="56" cy="30" r="4" />
        </>
      );
    case "protein":
      return (
        <>
          <ellipse className="level-badge__plate" cx="40" cy="46" rx="22" ry="9" />
          <ellipse className="level-badge__protein-main" cx="40" cy="38" rx="12" ry="8" />
          <circle className="level-badge__protein-dot" cx="32" cy="36" r="2.5" />
          <circle className="level-badge__protein-dot" cx="48" cy="36" r="2.5" />
        </>
      );
    case "crewmate":
      return (
        <>
          <circle className="level-badge__crew" cx="28" cy="34" r="8" />
          <circle className="level-badge__crew" cx="52" cy="34" r="8" />
          <circle className="level-badge__crew level-badge__crew--lead" cx="40" cy="26" r="9" />
          <path className="level-badge__crew-arc" d="M22 50 Q40 58 58 50" />
        </>
      );
    case "chef":
      return (
        <>
          <path className="level-badge__toque" d="M26 34 Q40 10 54 34 L52 42 H28 Z" />
          <rect className="level-badge__toque-band" x="28" y="40" width="24" height="8" rx="2" />
          <path className="level-badge__spoon" d="M48 46 Q54 36 58 28" />
        </>
      );
    case "hawk":
      return (
        <>
          <ellipse className="level-badge__eye-white" cx="40" cy="36" rx="18" ry="12" />
          <circle className="level-badge__eye-iris" cx="40" cy="36" r="7" />
          <circle className="level-badge__eye-pupil" cx="40" cy="36" r="3" />
          <ellipse className="level-badge__leaf" cx="58" cy="22" rx="8" ry="5" transform="rotate(25 58 22)" />
        </>
      );
    case "streaker":
      return (
        <>
          <path className="level-badge__wave" d="M16 48 Q28 36 40 48 T64 48" />
          <path className="level-badge__flame" d="M40 14c-8 10-14 18-14 28a14 14 0 0 0 28 0c0-8-6-16-14-28zm0 36a6 6 0 0 1-4-10c2-3 4-8 4-10 0 2 2 7 4 10a6 6 0 0 1-4 10z" />
        </>
      );
    case "captain":
      return (
        <>
          <circle className="level-badge__wheel" cx="40" cy="38" r="16" />
          <path className="level-badge__wheel-spoke" d="M40 22 v32 M24 38 h32 M28 26 l24 24 M52 26 L28 50" />
          <circle className="level-badge__wheel-hub" cx="40" cy="38" r="4" />
        </>
      );
    case "champion":
      return (
        <>
          <path className="level-badge__trophy" d="M30 48 V32 h20 v16 M26 32 h28 v6 H26 Z" />
          <path className="level-badge__trophy-cup" d="M32 20 h16 v12 H32 Z" />
          <path className="level-badge__trophy-handle" d="M32 24 H24 a6 6 0 0 0 0 8 h8 M48 24 h8 a6 6 0 0 1 0 8 h-8" />
        </>
      );
    case "master":
      return (
        <>
          <path className="level-badge__book" d="M24 18 h14 v36 H24 a6 6 0 0 1-6-6 V24 a6 6 0 0 1 6-6zm32 0 H42 v36 h14 a6 6 0 0 0 6-6 V24 a6 6 0 0 0-6-6z" />
          <path className="level-badge__star" d="M40 26 L42 32 L48 32 L43 36 L45 42 L40 38 L35 42 L37 36 L32 32 L38 32 Z" />
        </>
      );
    case "legend":
      return (
        <>
          <path className="level-badge__crown" d="M24 42 L30 24 L40 34 L50 24 L56 42 Z" />
          <rect className="level-badge__crown-base" x="24" y="42" width="32" height="8" rx="2" />
          <circle className="level-badge__gem" cx="40" cy="34" r="3" />
          <circle className="level-badge__spark level-badge__spark--b" cx="20" cy="20" r="2" />
          <circle className="level-badge__spark level-badge__spark--c" cx="60" cy="18" r="2" />
        </>
      );
    default:
      return (
        <circle className="level-badge__fallback" cx="40" cy="36" r="14" />
      );
  }
}

/** Animated crew level badge (replaces emoji in progress card). */
export function LevelBadgeIcon({
  titleKey,
  size = 168,
  active = false,
  dimmed = false,
}: Props) {
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
      <span className="level-badge__glow" />
      <span className="level-badge__ring" />
      <span className="level-badge__shine" />
      <span className="level-badge__sparkles" />
      <svg
        className="level-badge__svg"
        viewBox="0 0 80 64"
        xmlns="http://www.w3.org/2000/svg"
        role="presentation"
      >
        <LevelArt titleKey={titleKey} />
      </svg>
    </span>
  );
}
