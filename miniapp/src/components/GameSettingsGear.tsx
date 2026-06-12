import { useId } from "react";

type Props = {
  className?: string;
};

export function GameSettingsGear({ className = "" }: Props) {
  const uid = useId().replace(/:/g, "");
  const g = (name: string) => `${uid}-${name}`;

  return (
    <span className={`game-settings-gear ${className}`.trim()} aria-hidden="true">
      <span className="game-settings-gear__badge">
        <svg className="game-settings-gear__svg" viewBox="0 0 48 48">
          <defs>
            <linearGradient id={g("metal-top")} x1="20%" y1="0%" x2="80%" y2="100%">
              <stop offset="0%" stopColor="#f8fafc" />
              <stop offset="35%" stopColor="#d8e0ea" />
              <stop offset="68%" stopColor="#a8b4c4" />
              <stop offset="100%" stopColor="#6b7888" />
            </linearGradient>
            <linearGradient id={g("metal-rim")} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#eef2f8" />
              <stop offset="100%" stopColor="#5a6678" />
            </linearGradient>
            <radialGradient id={g("hole")} cx="50%" cy="42%" r="55%">
              <stop offset="0%" stopColor="#3a4a42" />
              <stop offset="100%" stopColor="#1a2420" />
            </radialGradient>
            <linearGradient id={g("shine")} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fff" stopOpacity="0.65" />
              <stop offset="45%" stopColor="#fff" stopOpacity="0" />
            </linearGradient>
          </defs>
          <circle cx="24" cy="24" r="21" fill={`url(#${g("metal-rim")})`} opacity="0.35" />
          <path
            fill={`url(#${g("metal-top")})`}
            stroke="#4a5568"
            strokeWidth="1.25"
            strokeLinejoin="round"
            d="M24 7.5 26.4 7.8 27.6 11.8 31.2 12.8 33.8 10.2 36.4 12.8 33.8 15.4 34.8 19 38.8 20.2 39.1 22.6 38.8 25 34.8 26.2 33.8 29.8 36.4 32.4 33.8 35 31.2 32.4 27.6 33.4 26.4 37.4 24 37.7 21.6 37.4 20.4 33.4 16.8 32.4 14.2 35 11.6 32.4 14.2 29.8 13.2 26.2 9.2 25 8.9 22.6 9.2 20.2 13.2 19 14.2 15.4 11.6 12.8 14.2 10.2 16.8 12.8 20.4 11.8 21.6 7.8 24 7.5Z"
          />
          <circle cx="24" cy="24" r="7.8" fill={`url(#${g("hole")})`} stroke="#3d4a54" strokeWidth="1.2" />
          <circle cx="24" cy="24" r="4.2" fill="none" stroke="#5c6a78" strokeWidth="0.8" opacity="0.55" />
          <ellipse cx="19" cy="17" rx="5" ry="3.2" fill={`url(#${g("shine")})`} transform="rotate(-28 19 17)" />
        </svg>
      </span>
    </span>
  );
}
