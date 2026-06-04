import { useId } from "react";
import type { CSSProperties } from "react";

type SplashGradientLogoProps = {
  peachSize?: number;
};

/** Vector peach — no raster masks; works in Telegram WebView */
export function SplashGradientLogo({ peachSize }: SplashGradientLogoProps) {
  const uid = useId().replace(/:/g, "");
  const gradId = `peach-grad-${uid}`;
  const shineId = `peach-shine-${uid}`;

  const style = peachSize
    ? ({ "--splash-peach-size": `${peachSize}px` } as CSSProperties)
    : undefined;

  const peachBody =
    "M60 24c-19 0-34 15-35 36-1 12 5 25 16 32 3 2 6.5 3 10 3 18 0 34-13 35-33 0-10-5-20-13-26-2-1.5-5-2.5-8-7 1.5-5.5 6-9.5 11.5-11 2.5-.8 5-.5 7.5 0z";
  const peachHeart =
    "M60 52c-4-6-11.5-5.2-14.2 1.5-2 5.2.8 10.8 6.5 12.6 2.6.9 5.5.7 8-.8 6.2-3.8 8.2-9.5 6-12.2-1-1.6-3-3-6-2.6-8.2 1.4-4.2 4.8-7 9-6.2z";

  return (
    <div className="splash-brand-logo" style={style}>
      <div className="splash-brand-logo__reveal">
        <svg
          className="splash-peach-svg"
          viewBox="0 0 120 128"
          xmlns="http://www.w3.org/2000/svg"
          role="img"
          aria-label="NutriCrew"
        >
          <defs>
            <linearGradient id={shineId} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#fff8f2" stopOpacity="0.85" />
              <stop offset="55%" stopColor="#fff8f2" stopOpacity="0" />
            </linearGradient>
            <linearGradient
              id={gradId}
              gradientUnits="userSpaceOnUse"
              x1="24"
              y1="30"
              x2="96"
              y2="102"
            >
              <stop offset="0%" stopColor="#fff0e6" />
              <stop offset="22%" stopColor="#f5c4a0" />
              <stop offset="48%" stopColor="#b8e0c8" />
              <stop offset="72%" stopColor="#e8a078" />
              <stop offset="100%" stopColor="#d8f2e4" />
              <animate
                attributeName="x1"
                values="24;86;30;24"
                dur="5.5s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="y1"
                values="30;42;70;30"
                dur="5.5s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="x2"
                values="96;42;94;96"
                dur="5.5s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="y2"
                values="102;94;50;102"
                dur="5.5s"
                repeatCount="indefinite"
              />
            </linearGradient>
          </defs>

          <g className="splash-peach-leaves">
            <ellipse cx="44" cy="14" rx="10" ry="6" fill="#7aab82" transform="rotate(-34 44 14)" />
            <ellipse cx="76" cy="14" rx="10" ry="6" fill="#7aab82" transform="rotate(34 76 14)" />
            <path
              d="M60 18 L60 24"
              stroke="#6b9470"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </g>

          <path fill="#f5d0b4" d={peachBody} />
          <path fill={`url(#${gradId})`} d={peachBody} />
          <ellipse cx="48" cy="44" rx="14" ry="10" fill={`url(#${shineId})`} opacity="0.55" />

          <path fill="#ef8a78" d={peachHeart} />
          <path
            fill="none"
            stroke="#e07a6a"
            strokeWidth="1.25"
            strokeLinejoin="round"
            d={peachHeart}
          />

          <path
            fill="none"
            stroke="#e8a882"
            strokeWidth="3.5"
            strokeLinejoin="round"
            strokeLinecap="round"
            d={peachBody}
          />
        </svg>

        <p className="splash-brand-wordmark" aria-hidden>
          Nutri<span className="splash-brand-wordmark-crew">Crew</span>
        </p>
      </div>
      <span className="visually-hidden">NutriCrew</span>
    </div>
  );
}
