import { useId, type CSSProperties } from "react";
import type { LeagueTier } from "./LeagueTierBadge";

type Props = {
  tier: LeagueTier;
  size?: number;
};

export function LeagueTierBadgeIcon({ tier, size = 56 }: Props) {
  const uid = useId().replace(/:/g, "");
  const g = (name: string) => `url(#${uid}-${name})`;

  function art() {
    switch (tier) {
      case "bronze":
        return (
          <>
            <path className="tier-badge__ribbon" d="M28 38 L32 48 L36 38 Z" fill="#cd7f32" />
            <circle className="tier-badge__medal" cx="32" cy="28" r="14" fill={g("bronze")} />
            <circle className="tier-badge__medal-inner" cx="32" cy="28" r="9" fill="#b87333" opacity="0.45" />
            <text x="32" y="32" textAnchor="middle" fontSize="11" fontWeight="800" fill="#fff8ee">3</text>
          </>
        );
      case "silver":
        return (
          <>
            <path className="tier-badge__ribbon" d="M28 38 L32 48 L36 38 Z" fill="#90a4ae" />
            <circle className="tier-badge__medal" cx="32" cy="28" r="14" fill={g("silver")} />
            <path className="tier-badge__medal-shine" d="M26 22 L28 34" stroke="#fff" strokeWidth="1.5" opacity="0.5" />
            <text x="32" y="32" textAnchor="middle" fontSize="11" fontWeight="800" fill="#fff">2</text>
          </>
        );
      case "gold":
        return (
          <>
            <path className="tier-badge__trophy-base" d="M24 42 h16 v4 H24z" fill={g("gold")} />
            <path className="tier-badge__trophy-cup" d="M26 18 h12 v18 a6 6 0 0 1-12 0z" fill={g("gold")} />
            <path className="tier-badge__trophy-handle" d="M26 22 H20 a3 3 0 0 0 0 6 h6 M38 22 h6 a3 3 0 0 1 0 6 h-6" />
            <circle className="tier-badge__spark" cx="44" cy="16" r="2" fill="#fff8e1" />
          </>
        );
      case "platinum":
        return (
          <>
            <path className="tier-badge__gem" d="M32 12 L44 28 L32 44 L20 28 Z" fill={g("platinum")} />
            <path className="tier-badge__gem-shine" d="M26 24 L32 18 L38 24" stroke="#fff" strokeWidth="1.2" fill="none" opacity="0.55" />
            <circle className="tier-badge__spark" cx="18" cy="20" r="1.5" fill="#e3f2fd" />
          </>
        );
      case "diamond":
        return (
          <>
            <path className="tier-badge__gem tier-badge__gem--d" d="M32 10 L46 28 L32 46 L18 28 Z" fill={g("diamond")} />
            <path className="tier-badge__gem-shine" d="M24 22 L32 14 L40 22" stroke="#fff" strokeWidth="1.4" fill="none" />
            <circle className="tier-badge__spark" cx="46" cy="18" r="2" fill="#e1bee7" />
            <circle className="tier-badge__spark tier-badge__spark--b" cx="16" cy="34" r="1.5" fill="#b39ddb" />
          </>
        );
    }
  }

  return (
    <span
      className={`tier-badge tier-badge--${tier} tier-badge--live`}
      style={{ "--tier-badge-size": `${size}px` } as CSSProperties}
      aria-hidden
    >
      <span className="tier-badge__ring" />
      <span className="tier-badge__shine" />
      <span className="tier-badge__aura" />
      <span className="tier-badge__particles" />
      <svg className="tier-badge__svg" viewBox="0 0 64 64">
        <defs>
          <linearGradient id={`${uid}-bronze`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#e8a86a" />
            <stop offset="100%" stopColor="#a0622a" />
          </linearGradient>
          <linearGradient id={`${uid}-silver`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#eceff1" />
            <stop offset="100%" stopColor="#90a4ae" />
          </linearGradient>
          <linearGradient id={`${uid}-gold`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffe082" />
            <stop offset="100%" stopColor="#c9a227" />
          </linearGradient>
          <linearGradient id={`${uid}-platinum`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e3f2fd" />
            <stop offset="100%" stopColor="#64b5f6" />
          </linearGradient>
          <linearGradient id={`${uid}-diamond`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e1bee7" />
            <stop offset="100%" stopColor="#7e57c2" />
          </linearGradient>
        </defs>
        {art()}
      </svg>
    </span>
  );
}
