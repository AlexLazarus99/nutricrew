import { useId } from "react";

type Props = {
  size?: number;
  animated?: boolean;
};

export function SupportBadgeIcon({ size = 56, animated = true }: Props) {
  const uid = useId().replace(/:/g, "");
  const g = (name: string) => `url(#${uid}-${name})`;
  const rootClass = ["support-badge", animated ? "support-badge--live" : ""].filter(Boolean).join(" ");

  return (
    <span className={rootClass} style={{ width: size, height: size }} aria-hidden>
      <span className="support-badge__ring" />
      <span className="support-badge__glow" />
      <svg className="support-badge__svg" viewBox="0 0 64 64">
        <defs>
          <linearGradient id={`${uid}-bg`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e3f2fd" />
            <stop offset="100%" stopColor="#b2ebf2" />
          </linearGradient>
          <linearGradient id={`${uid}-headset`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#42a5f5" />
            <stop offset="100%" stopColor="#1565c0" />
          </linearGradient>
          <linearGradient id={`${uid}-mic`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#81d4fa" />
            <stop offset="100%" stopColor="#29b6f6" />
          </linearGradient>
        </defs>
        <rect x="8" y="8" width="48" height="48" rx="14" fill={g("bg")} />
        <path
          className="support-badge__headset"
          d="M18 30 a14 14 0 0 1 28 0 v8 a6 6 0 0 1-6 6 h-3 v-6 h12 v6 a6 6 0 0 1-6-6 v-8"
          fill="none"
          stroke={g("headset")}
          strokeWidth="3.2"
          strokeLinecap="round"
        />
        <rect className="support-badge__mic" x="29" y="44" width="6" height="8" rx="2" fill={g("mic")} />
        <circle className="support-badge__pulse" cx="46" cy="20" r="3" fill="#ffca28" />
        <text
          className="support-badge__q"
          x="22"
          y="28"
          fontSize="11"
          fontWeight="800"
          fill="#0d47a1"
        >
          ?
        </text>
      </svg>
    </span>
  );
}
