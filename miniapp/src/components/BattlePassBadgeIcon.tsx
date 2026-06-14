import { useId, type CSSProperties } from "react";

type Props = {
  tier: number;
  size?: number;
};

export function BattlePassBadgeIcon({ tier, size = 64 }: Props) {
  const uid = useId().replace(/:/g, "");
  const g = (name: string) => `url(#${uid}-${name})`;

  return (
    <span
      className="pass-badge pass-badge--live"
      style={{ "--pass-badge-size": `${size}px` } as CSSProperties}
      aria-hidden
    >
      <span className="pass-badge__ring" />
      <span className="pass-badge__shine" />
      <span className="pass-badge__aura" />
      <span className="pass-badge__particles" />
      <svg className="pass-badge__svg" viewBox="0 0 64 64">
        <defs>
          <linearGradient id={`${uid}-pass`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#9fd9b8" />
            <stop offset="100%" stopColor="#5a9e82" />
          </linearGradient>
          <linearGradient id={`${uid}-gold`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffe082" />
            <stop offset="100%" stopColor="#c9a227" />
          </linearGradient>
        </defs>
        <rect className="pass-badge__ticket" x="14" y="16" width="36" height="32" rx="6" fill={g("pass")} />
        <circle className="pass-badge__hole" cx="14" cy="32" r="4" fill="var(--section-bg, #1a2420)" />
        <circle className="pass-badge__hole" cx="50" cy="32" r="4" fill="var(--section-bg, #1a2420)" />
        <path className="pass-badge__stripe" d="M22 24 h20 M22 32 h20 M22 40 h14" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity="0.45" />
        <circle className="pass-badge__star" cx="46" cy="22" r="6" fill={g("gold")} />
        <text x="46" y="25" textAnchor="middle" fontSize="8" fontWeight="800" fill="#fff8ee">
          {tier}
        </text>
      </svg>
    </span>
  );
}
