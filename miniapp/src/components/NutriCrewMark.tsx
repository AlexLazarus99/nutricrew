import { useId } from "react";
import type { CSSProperties } from "react";

type NutriCrewMarkProps = {
  size?: number;
  showWordmark?: boolean;
  animated?: boolean;
  /** Splash screen: entrance from light rays (handled in parent CSS) */
  splash?: boolean;
  className?: string;
};

/** NutriCrew emblem — line-art bowl, leaf, crew arc */
export function NutriCrewMark({
  size = 96,
  showWordmark = false,
  animated = true,
  splash = false,
  className = "",
}: NutriCrewMarkProps) {
  const uid = useId().replace(/:/g, "");
  const rootClass = [
    "nutricrew-mark",
    animated ? "nutricrew-mark--animated" : "",
    splash ? "nutricrew-mark--splash" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={rootClass} style={{ "--nutricrew-size": `${size}px` } as CSSProperties}>
      <div className="nutricrew-mark-icon" aria-hidden>
        <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg" role="presentation">
          <defs>
            <linearGradient id={`nc-bg-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fafdfb" />
              <stop offset="100%" stopColor="#e2f0e8" />
            </linearGradient>
            <linearGradient id={`nc-stroke-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#5a9e78" />
              <stop offset="100%" stopColor="#3d7d5c" />
            </linearGradient>
            <linearGradient id={`nc-leaf-${uid}`} x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#6aab7e" />
              <stop offset="100%" stopColor="#a8dcc0" />
            </linearGradient>
            <radialGradient id={`nc-shine-${uid}`} cx="50%" cy="38%" r="55%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect x="5" y="5" width="70" height="70" rx="20" fill={`url(#nc-bg-${uid})`} />
          <rect
            x="5.5"
            y="5.5"
            width="69"
            height="69"
            rx="19.5"
            fill="none"
            stroke="rgba(126, 196, 160, 0.35)"
            strokeWidth="1"
          />
          <circle cx="40" cy="40" r="31" fill={`url(#nc-shine-${uid})`} />
          <circle
            className="nutricrew-mark-halo"
            cx="40"
            cy="40"
            r="28"
            fill="none"
            stroke={`url(#nc-stroke-${uid})`}
            strokeWidth="1.25"
            opacity="0.55"
          />
          <g className="nutricrew-mark-plate" fill="none" stroke={`url(#nc-stroke-${uid})`} strokeWidth="2" strokeLinecap="round">
            <ellipse cx="40" cy="46" rx="18" ry="6.5" />
            <path d="M22 46 Q40 38 58 46" opacity="0.35" strokeWidth="1.25" />
          </g>
          <g className="nutricrew-mark-leaf">
            <path
              d="M52 28 C60 26 62 36 54 40 C49 34 50 29 52 28 Z"
              fill={`url(#nc-leaf-${uid})`}
            />
            <path
              d="M53 31 Q56 36 54 39"
              fill="none"
              stroke="#4a8f66"
              strokeWidth="1.25"
              strokeLinecap="round"
            />
          </g>
          <g className="nutricrew-mark-crew">
            <path
              d="M28 54 Q40 58 52 54"
              fill="none"
              stroke="#9ec8e8"
              strokeWidth="1.25"
              strokeLinecap="round"
              opacity="0.7"
            />
            <circle cx="30" cy="53" r="3" fill="#8fd4a8" />
            <circle cx="40" cy="55" r="3.25" fill="#6ec4a0" />
            <circle cx="50" cy="53" r="3" fill="#9ec8e8" />
          </g>
        </svg>
      </div>
      {showWordmark ? (
        <p className="nutricrew-mark-wordmark" aria-hidden>
          <span className="nutricrew-mark-word-nutri">Nutri</span>
          <span className="nutricrew-mark-word-crew">Crew</span>
        </p>
      ) : null}
      <span className="visually-hidden">NutriCrew</span>
    </div>
  );
}
