/** Decorative low-opacity fitness SVGs behind app content. */
export function FitnessBackground() {
  return (
    <div className="fitness-bg" aria-hidden="true">
      <svg className="fitness-bg-svg" viewBox="0 0 480 900" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="fitness-bg-glow" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--section-accent)" stopOpacity="0.12" />
            <stop offset="100%" stopColor="var(--section-surface-2)" stopOpacity="0.08" />
          </linearGradient>
        </defs>
        <rect width="480" height="900" fill="url(#fitness-bg-glow)" />

        {/* Dumbbell — top right */}
        <g className="fitness-bg-fig fitness-bg-fig-1" transform="translate(340 40) rotate(12)">
          <rect x="8" y="18" width="64" height="8" rx="4" fill="#64748b" />
          <rect x="0" y="10" width="14" height="24" rx="4" fill="#475569" />
          <rect x="66" y="10" width="14" height="24" rx="4" fill="#475569" />
        </g>

        {/* Runner — left */}
        <g className="fitness-bg-fig fitness-bg-fig-2" transform="translate(24 180)">
          <circle cx="20" cy="12" r="10" fill="#64748b" />
          <path d="M20 22 L16 48 M20 22 L28 38 M16 48 L8 68 M28 38 L36 58 M16 48 L28 58" stroke="#64748b" strokeWidth="6" strokeLinecap="round" fill="none" />
        </g>

        {/* Yoga stretch — right mid */}
        <g className="fitness-bg-fig fitness-bg-fig-3" transform="translate(360 260) scale(0.9)">
          <circle cx="24" cy="10" r="9" fill="#64748b" />
          <path d="M24 19 L24 42 M24 42 L8 52 M24 42 L40 52 M24 28 L8 22 M24 28 L40 22" stroke="#64748b" strokeWidth="5" strokeLinecap="round" fill="none" />
        </g>

        {/* Kettlebell — center left */}
        <g className="fitness-bg-fig fitness-bg-fig-4" transform="translate(60 420)">
          <path d="M28 8 C18 8 12 16 12 24 C12 32 18 36 28 36 C38 36 44 32 44 24 C44 16 38 8 28 8 Z" fill="#475569" />
          <rect x="22" y="36" width="12" height="28" rx="4" fill="#64748b" />
          <rect x="14" y="62" width="28" height="10" rx="4" fill="#475569" />
        </g>

        {/* Squat figure — right lower */}
        <g className="fitness-bg-fig fitness-bg-fig-5" transform="translate(320 520)">
          <circle cx="22" cy="10" r="9" fill="#64748b" />
          <path d="M22 19 L22 34 M22 34 L12 48 M22 34 L32 48 M12 48 L8 58 M32 48 L36 58" stroke="#64748b" strokeWidth="6" strokeLinecap="round" fill="none" />
        </g>

        {/* Heart rate line */}
        <polyline
          className="fitness-bg-fig fitness-bg-fig-6"
          points="40,680 80,680 95,640 110,720 125,660 140,700 160,680 220,680"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Plate + leaf — nutrition */}
        <g className="fitness-bg-fig fitness-bg-fig-7" transform="translate(300 720)">
          <circle cx="40" cy="40" r="32" fill="none" stroke="#64748b" strokeWidth="3" />
          <circle cx="28" cy="36" r="8" fill="currentColor" opacity="0.6" />
          <circle cx="44" cy="44" r="6" fill="#f59e0b" opacity="0.6" />
          <path d="M52 28 Q58 20 64 28 L58 40 Z" fill="currentColor" opacity="0.5" />
        </g>

        {/* Jumping jack — top center */}
        <g className="fitness-bg-fig fitness-bg-fig-8" transform="translate(200 90) scale(0.85)">
          <circle cx="20" cy="8" r="8" fill="#64748b" />
          <path d="M20 16 L20 36 M20 36 L12 52 M20 36 L28 52 M20 22 L4 14 M20 22 L36 14" stroke="#64748b" strokeWidth="5" strokeLinecap="round" fill="none" />
        </g>

        {/* Bike wheel */}
        <g className="fitness-bg-fig fitness-bg-fig-9" transform="translate(30 780)">
          <circle cx="36" cy="36" r="28" fill="none" stroke="#475569" strokeWidth="4" />
          <circle cx="36" cy="36" r="6" fill="#64748b" />
          <line x1="36" y1="8" x2="36" y2="64" stroke="#64748b" strokeWidth="2" />
          <line x1="8" y1="36" x2="64" y2="36" stroke="#64748b" strokeWidth="2" />
        </g>
      </svg>
    </div>
  );
}
