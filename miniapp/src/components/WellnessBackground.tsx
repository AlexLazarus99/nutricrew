/** Soft organic shapes — wellness / nutrition mood (not gym-heavy). */
export function WellnessBackground() {
  return (
    <div className="fitness-bg wellness-bg" aria-hidden="true">
      <svg className="fitness-bg-svg" viewBox="0 0 480 900" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="wellness-bg-glow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--section-accent)" stopOpacity="0.14" />
            <stop offset="55%" stopColor="var(--section-accent)" stopOpacity="0.04" />
            <stop offset="100%" stopColor="var(--section-bg)" stopOpacity="0" />
          </linearGradient>
          <radialGradient id="wellness-blob-a" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--section-accent)" stopOpacity="0.2" />
            <stop offset="100%" stopColor="var(--section-accent)" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="480" height="900" fill="url(#wellness-bg-glow)" />

        <ellipse
          className="fitness-bg-fig wellness-blob"
          cx="400"
          cy="120"
          rx="100"
          ry="80"
          fill="url(#wellness-blob-a)"
        />
        <ellipse
          className="fitness-bg-fig wellness-blob"
          cx="80"
          cy="320"
          rx="90"
          ry="70"
          fill="url(#wellness-blob-a)"
        />

        {/* Leaf cluster — top right */}
        <g className="fitness-bg-fig wellness-bg-fig-1" transform="translate(360 48) rotate(-8)">
          <path
            d="M0 40 C20 0 50 5 55 35 C58 55 30 62 0 40 Z"
            fill="currentColor"
            opacity="0.5"
          />
          <path
            d="M20 50 C35 25 55 30 48 52"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
            opacity="0.4"
          />
        </g>

        {/* Bowl / plate */}
        <g className="fitness-bg-fig wellness-bg-fig-2" transform="translate(40 200)">
          <ellipse cx="48" cy="52" rx="44" ry="14" fill="currentColor" opacity="0.25" />
          <path
            d="M12 48 Q48 20 84 48"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            opacity="0.35"
          />
          <circle cx="36" cy="44" r="8" fill="currentColor" opacity="0.3" />
          <circle cx="56" cy="40" r="6" fill="currentColor" opacity="0.25" />
        </g>

        {/* Avocado-style organic */}
        <g className="fitness-bg-fig wellness-bg-fig-3" transform="translate(320 280)">
          <ellipse cx="32" cy="40" rx="22" ry="32" fill="currentColor" opacity="0.2" />
          <circle cx="32" cy="36" r="8" fill="currentColor" opacity="0.35" />
        </g>

        {/* Gentle wave — hydration */}
        <path
          className="fitness-bg-fig wellness-bg-fig-4"
          d="M0 520 Q120 480 240 520 T480 520 L480 560 L0 560 Z"
          fill="currentColor"
          opacity="0.08"
        />

        {/* Apple silhouette */}
        <g className="fitness-bg-fig wellness-bg-fig-5" transform="translate(72 580)">
          <path
            d="M40 8 C48 0 52 12 48 20 C55 28 52 55 40 68 C28 55 25 28 32 20 C28 12 32 0 40 8 Z"
            fill="currentColor"
            opacity="0.22"
          />
          <path d="M40 4 L42 -6" stroke="currentColor" strokeWidth="2" opacity="0.35" />
        </g>

        {/* Heart-rate — soft line */}
        <polyline
          className="fitness-bg-fig wellness-bg-fig-6"
          points="60,720 100,720 115,690 130,750 145,710 160,740 200,720"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity="0.25"
        />

        {/* Small leaves — bottom */}
        <g className="fitness-bg-fig wellness-bg-fig-7" transform="translate(300 760)">
          <path d="M0 20 C15 0 35 8 30 28 C12 32 0 20 0 20 Z" fill="currentColor" opacity="0.3" />
          <path d="M35 25 C50 10 65 18 58 35" fill="currentColor" opacity="0.25" />
        </g>
      </svg>
    </div>
  );
}
