import type { CSSProperties } from "react";

type NutriBirdMarkProps = {
  size?: number;
  showWordmark?: boolean;
  animated?: boolean;
  className?: string;
};

/** Minimal NutriBird mark — soft wellness palette, subtle motion */
export function NutriBirdMark({
  size = 72,
  showWordmark = false,
  animated = true,
  className = "",
}: NutriBirdMarkProps) {
  const rootClass = [
    "nutribird-mark",
    animated ? "nutribird-mark--animated" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={rootClass} style={{ "--nutribird-size": `${size}px` } as CSSProperties}>
      <div className="nutribird-mark-icon" aria-hidden>
        <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg" role="presentation">
          <defs>
            <linearGradient id="nb-bg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f4fbf6" />
              <stop offset="100%" stopColor="#dcefe4" />
            </linearGradient>
            <linearGradient id="nb-body" x1="30%" y1="20%" x2="70%" y2="90%">
              <stop offset="0%" stopColor="#8fd4a8" />
              <stop offset="100%" stopColor="#5fb88a" />
            </linearGradient>
          </defs>
          <rect x="4" y="4" width="72" height="72" rx="22" fill="url(#nb-bg)" />
          <circle className="nutribird-mark-halo" cx="40" cy="40" r="30" fill="none" stroke="#7ec4a0" strokeWidth="1.5" />
          <g className="nutribird-mark-bird">
            <ellipse cx="40" cy="44" rx="22" ry="19" fill="url(#nb-body)" />
            <ellipse cx="40" cy="48" rx="14" ry="11" fill="#e8f7ed" opacity="0.9" />
            <g className="nutribird-mark-wing">
              <ellipse cx="28" cy="42" rx="11" ry="7" fill="#6aab7e" transform="rotate(-18 28 42)" />
            </g>
            <circle cx="50" cy="38" r="5.5" fill="#fff" />
            <circle cx="52" cy="38" r="2.2" fill="#1e3a2f" />
            <path d="M58 40 L66 41 L58 44 Z" fill="#e8a85c" />
          </g>
        </svg>
      </div>
      {showWordmark ? (
        <p className="nutribird-mark-wordmark" aria-hidden>
          <span className="nutribird-mark-word-nutri">Nutri</span>
          <span className="nutribird-mark-word-bird">Bird</span>
        </p>
      ) : null}
      <span className="visually-hidden">NutriBird</span>
    </div>
  );
}
