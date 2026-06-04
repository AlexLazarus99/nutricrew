import type { CSSProperties } from "react";

type NutriCrewMarkProps = {
  size?: number;
  showWordmark?: boolean;
  animated?: boolean;
  className?: string;
};

/** Minimal NutriCrew mark — plate + leaf + crew dots, wellness palette */
export function NutriCrewMark({
  size = 96,
  showWordmark = false,
  animated = true,
  className = "",
}: NutriCrewMarkProps) {
  const rootClass = [
    "nutricrew-mark",
    animated ? "nutricrew-mark--animated" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={rootClass} style={{ "--nutricrew-size": `${size}px` } as CSSProperties}>
      <div className="nutricrew-mark-icon" aria-hidden>
        <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg" role="presentation">
          <defs>
            <linearGradient id="nc-bg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f4fbf6" />
              <stop offset="100%" stopColor="#dcefe4" />
            </linearGradient>
            <linearGradient id="nc-leaf" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#6aab7e" />
              <stop offset="100%" stopColor="#8fd4a8" />
            </linearGradient>
          </defs>
          <rect x="4" y="4" width="72" height="72" rx="22" fill="url(#nc-bg)" />
          <circle className="nutricrew-mark-halo" cx="40" cy="40" r="30" fill="none" stroke="#7ec4a0" strokeWidth="1.5" />
          <g className="nutricrew-mark-plate">
            <ellipse cx="40" cy="44" rx="24" ry="9" fill="#e8f4ec" />
            <ellipse cx="40" cy="42" rx="20" ry="7" fill="none" stroke="#5fb88a" strokeWidth="2" />
          </g>
          <g className="nutricrew-mark-leaf">
            <path
              d="M54 30 C62 28 64 38 56 42 C52 36 54 30 54 30 Z"
              fill="url(#nc-leaf)"
            />
            <path d="M55 34 L58 40" stroke="#4a8f66" strokeWidth="1.5" strokeLinecap="round" />
          </g>
          <g className="nutricrew-mark-crew">
            <circle cx="32" cy="52" r="3.5" fill="#8fd4a8" />
            <circle cx="40" cy="54" r="3.5" fill="#7ec4a0" />
            <circle cx="48" cy="52" r="3.5" fill="#9ec8e8" />
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
