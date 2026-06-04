import type { CSSProperties } from "react";
import type { QuestStatus } from "../api/client";

type QuestIconProps = {
  questId: string;
  status: QuestStatus;
  emoji?: string;
  size?: number;
};

type IconVariant =
  | "sunrise"
  | "meals"
  | "bolt"
  | "flame"
  | "bird"
  | "brain"
  | "team"
  | "calendar"
  | "run"
  | "sparkle"
  | "medal"
  | "shield"
  | "game"
  | "challenge";

function variantFromQuestId(id: string): IconVariant {
  if (id.includes("challenge") || id === "crew_21_meals") return "challenge";
  if (id.includes("first_meal")) return id.startsWith("daily") ? "sunrise" : "medal";
  if (id.includes("three_meals") || id.includes("meals_") || id.includes("crew_meal"))
    return "meals";
  if (id.includes("points")) return "bolt";
  if (id.includes("streak")) return "flame";
  if (id.includes("nutribird") || id.includes("bird")) return "bird";
  if (id.includes("quiz")) return "brain";
  if (id.includes("team") || id.includes("join_team")) return id.includes("join") ? "shield" : "team";
  if (id.includes("meals_10")) return "calendar";
  if (id.includes("meals_20")) return "run";
  if (id.includes("meals_15")) return "sparkle";
  if (id.includes("game")) return "game";
  return "meals";
}

function IconArt({ variant }: { variant: IconVariant }) {
  switch (variant) {
    case "sunrise":
      return (
        <>
          <circle className="quest-icon__orb quest-icon__orb--sun" cx="40" cy="28" r="12" />
          <path
            className="quest-icon__ray"
            d="M40 10v6M40 54v6M22 28h-6M64 28h-6M27 15l-4-4M53 41l-4 4M27 41l-4 4M53 15l-4-4"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path className="quest-icon__hill" d="M14 58 Q40 44 66 58" />
        </>
      );
    case "bolt":
      return (
        <path
          className="quest-icon__bolt"
          d="M44 12 L30 38 h14 l-8 22 26-32 H48 L44 12z"
        />
      );
    case "flame":
      return (
        <path
          className="quest-icon__flame"
          d="M40 14c-8 10-14 18-14 28a14 14 0 0 0 28 0c0-8-6-16-14-28zm0 36a6 6 0 0 1-4-10c2-3 4-8 4-10 0 2 2 7 4 10a6 6 0 0 1-4 10z"
        />
      );
    case "bird":
      return (
        <>
          <ellipse className="quest-icon__bird-body" cx="40" cy="42" rx="18" ry="14" />
          <circle className="quest-icon__bird-eye" cx="46" cy="38" r="2.5" />
          <path className="quest-icon__bird-wing" d="M28 40 Q40 28 52 40" />
        </>
      );
    case "brain":
      return (
        <path
          className="quest-icon__brain"
          d="M40 18c-10 0-16 8-16 16 0 4 2 8 6 10-4 2-6 6-6 10 0 10 8 16 16 16s16-6 16-16c0-4-2-8-6-10 4-2 6-6 6-10 0-8-6-16-16-16z"
        />
      );
    case "team":
      return (
        <>
          <circle className="quest-icon__crew" cx="28" cy="34" r="8" />
          <circle className="quest-icon__crew" cx="52" cy="34" r="8" />
          <circle className="quest-icon__crew quest-icon__crew--lead" cx="40" cy="26" r="9" />
          <path className="quest-icon__crew-arc" d="M22 50 Q40 58 58 50" />
        </>
      );
    case "shield":
      return (
        <path
          className="quest-icon__shield"
          d="M40 14 L54 22 v16 c0 12-14 20-14 20S26 50 26 38 V22z"
        />
      );
    case "calendar":
      return (
        <>
          <rect className="quest-icon__cal" x="22" y="20" width="36" height="34" rx="6" />
          <path className="quest-icon__cal-line" d="M22 30 h36" />
          <circle className="quest-icon__cal-dot" cx="32" cy="40" r="3" />
          <circle className="quest-icon__cal-dot" cx="40" cy="40" r="3" />
          <circle className="quest-icon__cal-dot quest-icon__cal-dot--on" cx="48" cy="40" r="3" />
        </>
      );
    case "run":
      return (
        <path
          className="quest-icon__run"
          d="M24 52 L34 28 L44 38 L52 22 L56 26 L46 44 L52 52 Z"
        />
      );
    case "sparkle":
      return (
        <>
          <path className="quest-icon__star" d="M40 16 L43 30 L58 30 L46 40 L50 54 L40 46 L30 54 L34 40 L22 30 L37 30 Z" />
          <circle className="quest-icon__spark" cx="58" cy="20" r="2" />
          <circle className="quest-icon__spark quest-icon__spark--d" cx="18" cy="44" r="1.5" />
        </>
      );
    case "medal":
      return (
        <>
          <circle className="quest-icon__medal" cx="40" cy="36" r="16" />
          <path className="quest-icon__ribbon" d="M32 50 L40 58 L48 50" />
        </>
      );
    case "game":
      return (
        <>
          <rect className="quest-icon__pad" x="18" y="24" width="44" height="28" rx="8" />
          <circle className="quest-icon__pad-btn" cx="30" cy="38" r="4" />
          <circle className="quest-icon__pad-btn" cx="50" cy="38" r="4" />
        </>
      );
    case "challenge":
      return (
        <>
          <path className="quest-icon__bowl" d="M18 46 Q40 58 62 46 Q40 34 18 46z" />
          <ellipse className="quest-icon__leaf" cx="30" cy="28" rx="8" ry="5" transform="rotate(-25 30 28)" />
          <ellipse className="quest-icon__leaf" cx="50" cy="28" rx="8" ry="5" transform="rotate(25 50 28)" />
          <circle className="quest-icon__berry" cx="36" cy="40" r="3" />
          <circle className="quest-icon__berry" cx="44" cy="38" r="3" />
        </>
      );
    case "meals":
    default:
      return (
        <>
          <ellipse className="quest-icon__plate" cx="40" cy="44" rx="22" ry="10" />
          <path className="quest-icon__steam quest-icon__steam--1" d="M32 26 Q34 14 36 26" />
          <path className="quest-icon__steam quest-icon__steam--2" d="M40 22 Q42 8 44 22" />
          <path className="quest-icon__steam quest-icon__steam--3" d="M48 26 Q50 14 52 26" />
        </>
      );
  }
}

/** Animated quest / challenge icon */
export function QuestIcon({ questId, status, emoji, size = 52 }: QuestIconProps) {
  const variant = variantFromQuestId(questId);
  const rootClass = [
    "quest-icon",
    `quest-icon--${variant}`,
    `quest-icon--${status}`,
  ].join(" ");

  return (
    <span
      className={rootClass}
      style={{ "--quest-icon-size": `${size}px` } as CSSProperties}
      aria-hidden
      title={emoji}
    >
      <span className="quest-icon__ring" />
      <span className="quest-icon__sparkles" />
      <svg className="quest-icon__svg" viewBox="0 0 80 64" xmlns="http://www.w3.org/2000/svg" role="presentation">
        <IconArt variant={variant} />
      </svg>
      {status === "claimed" && <span className="quest-icon__check">✓</span>}
      {status === "locked" && <span className="quest-icon__lock">🔒</span>}
    </span>
  );
}

/** Team challenge card icon */
export function ChallengeIcon({
  challengeId = "crew_21_meals",
  completed = false,
  progress = 0,
  target = 1,
  size = 56,
}: {
  challengeId?: string;
  completed?: boolean;
  progress?: number;
  target?: number;
  size?: number;
}) {
  const status: QuestStatus = completed
    ? "claimed"
    : progress >= target
      ? "ready"
      : "active";
  return <QuestIcon questId={challengeId} status={status} emoji="🥗" size={size} />;
}
