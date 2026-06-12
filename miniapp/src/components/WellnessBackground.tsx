type DriftPiece = {
  kind: "leaf" | "drop" | "berry" | "orb" | "grain";
  top: string;
  left: string;
  size: number;
  anim: "a" | "b" | "c" | "d" | "e" | "f";
  duration: number;
  delay: number;
  opacity: number;
};

const DRIFT_PIECES: DriftPiece[] = [
  { kind: "leaf", top: "6%", left: "10%", size: 28, anim: "a", duration: 24, delay: 0, opacity: 0.28 },
  { kind: "orb", top: "14%", left: "72%", size: 52, anim: "b", duration: 31, delay: -6, opacity: 0.1 },
  { kind: "drop", top: "22%", left: "38%", size: 14, anim: "c", duration: 19, delay: -3, opacity: 0.22 },
  { kind: "berry", top: "18%", left: "88%", size: 12, anim: "d", duration: 26, delay: -11, opacity: 0.3 },
  { kind: "grain", top: "34%", left: "6%", size: 18, anim: "e", duration: 33, delay: -8, opacity: 0.2 },
  { kind: "leaf", top: "42%", left: "58%", size: 22, anim: "f", duration: 21, delay: -5, opacity: 0.24 },
  { kind: "orb", top: "48%", left: "82%", size: 64, anim: "a", duration: 36, delay: -14, opacity: 0.08 },
  { kind: "drop", top: "55%", left: "24%", size: 16, anim: "b", duration: 23, delay: -2, opacity: 0.18 },
  { kind: "berry", top: "62%", left: "46%", size: 10, anim: "c", duration: 27, delay: -9, opacity: 0.26 },
  { kind: "leaf", top: "68%", left: "14%", size: 26, anim: "d", duration: 29, delay: -7, opacity: 0.22 },
  { kind: "grain", top: "74%", left: "70%", size: 16, anim: "e", duration: 20, delay: -4, opacity: 0.19 },
  { kind: "orb", top: "80%", left: "36%", size: 44, anim: "f", duration: 34, delay: -12, opacity: 0.09 },
  { kind: "drop", top: "12%", left: "52%", size: 12, anim: "a", duration: 22, delay: -10, opacity: 0.16 },
  { kind: "leaf", top: "86%", left: "88%", size: 24, anim: "b", duration: 25, delay: -6, opacity: 0.2 },
  { kind: "berry", top: "28%", left: "92%", size: 11, anim: "e", duration: 18, delay: -1, opacity: 0.25 },
  { kind: "grain", top: "90%", left: "8%", size: 14, anim: "c", duration: 30, delay: -13, opacity: 0.17 },
];

function DriftIcon({ kind }: { kind: DriftPiece["kind"] }) {
  switch (kind) {
    case "leaf":
      return (
        <path
          d="M12 2 C18 8 20 18 12 24 C4 18 6 8 12 2 Z"
          fill="currentColor"
        />
      );
    case "drop":
      return (
        <path
          d="M12 3 C16 11 18 16 12 22 C6 16 8 11 12 3 Z"
          fill="currentColor"
        />
      );
    case "berry":
      return <circle cx="12" cy="12" r="5" fill="currentColor" />;
    case "grain":
      return (
        <ellipse cx="12" cy="12" rx="4" ry="7" fill="currentColor" transform="rotate(25 12 12)" />
      );
    default:
      return <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.55" />;
  }
}

function WellnessDriftField() {
  return (
    <div className="wellness-drift" aria-hidden="true">
      {DRIFT_PIECES.map((piece, index) => (
        <span
          key={`${piece.kind}-${index}`}
          className={`wellness-drift__piece wellness-drift__piece--${piece.anim} wellness-drift__piece--${piece.kind}`}
          style={{
            top: piece.top,
            left: piece.left,
            width: piece.size,
            height: piece.size,
            opacity: piece.opacity,
            animationDuration: `${piece.duration}s`,
            animationDelay: `${piece.delay}s`,
          }}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <DriftIcon kind={piece.kind} />
          </svg>
        </span>
      ))}
    </div>
  );
}

/** Soft organic shapes — wellness / nutrition mood (not gym-heavy). */
export function WellnessBackground() {
  return (
    <div className="fitness-bg wellness-bg" aria-hidden="true">
      <WellnessDriftField />
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
          className="fitness-bg-fig wellness-blob wellness-drift-fig wellness-drift-fig--a"
          cx="400"
          cy="120"
          rx="100"
          ry="80"
          fill="url(#wellness-blob-a)"
        />
        <ellipse
          className="fitness-bg-fig wellness-blob wellness-drift-fig wellness-drift-fig--b"
          cx="80"
          cy="320"
          rx="90"
          ry="70"
          fill="url(#wellness-blob-a)"
        />

        <g className="fitness-bg-fig wellness-bg-fig-1 wellness-drift-fig wellness-drift-fig--c" transform="translate(360 48) rotate(-8)">
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

        <g className="fitness-bg-fig wellness-bg-fig-2 wellness-drift-fig wellness-drift-fig--d" transform="translate(40 200)">
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

        <g className="fitness-bg-fig wellness-bg-fig-3 wellness-drift-fig wellness-drift-fig--e" transform="translate(320 280)">
          <ellipse cx="32" cy="40" rx="22" ry="32" fill="currentColor" opacity="0.2" />
          <circle cx="32" cy="36" r="8" fill="currentColor" opacity="0.35" />
        </g>

        <g className="fitness-bg-fig wellness-bg-fig-5 wellness-drift-fig wellness-drift-fig--f" transform="translate(72 580)">
          <path
            d="M40 8 C48 0 52 12 48 20 C55 28 52 55 40 68 C28 55 25 28 32 20 C28 12 32 0 40 8 Z"
            fill="currentColor"
            opacity="0.22"
          />
          <path d="M40 4 L42 -6" stroke="currentColor" strokeWidth="2" opacity="0.35" />
        </g>

        <polyline
          className="fitness-bg-fig wellness-bg-fig-6 wellness-drift-fig wellness-drift-fig--a"
          points="60,720 100,720 115,690 130,750 145,710 160,740 200,720"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity="0.25"
        />

        <g className="fitness-bg-fig wellness-bg-fig-7 wellness-drift-fig wellness-drift-fig--b" transform="translate(300 760)">
          <path d="M0 20 C15 0 35 8 30 28 C12 32 0 20 0 20 Z" fill="currentColor" opacity="0.3" />
          <path d="M35 25 C50 10 65 18 58 35" fill="currentColor" opacity="0.25" />
        </g>
      </svg>
    </div>
  );
}
