import { useId } from "react";
import type { CSSProperties } from "react";

type SplashGradientLogoProps = {
  peachSize?: number;
};

/** Vector peach (no background) + NutriCrew wordmark + flowing inner gradient */
export function SplashGradientLogo({ peachSize }: SplashGradientLogoProps) {
  const uid = useId().replace(/:/g, "");
  const gradId = `peach-grad-${uid}`;

  const style = peachSize
    ? ({ "--splash-peach-size": `${peachSize}px` } as CSSProperties)
    : undefined;

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
            <linearGradient
              id={gradId}
              gradientUnits="userSpaceOnUse"
              x1="20"
              y1="28"
              x2="100"
              y2="104"
            >
              <stop offset="0%" stopColor="#fff0e6" />
              <stop offset="25%" stopColor="#f5c4a0" />
              <stop offset="50%" stopColor="#9fd9b8" />
              <stop offset="75%" stopColor="#e8a078" />
              <stop offset="100%" stopColor="#d8f2e4" />
              <animate
                attributeName="x1"
                values="20;88;32;20"
                dur="5.5s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="y1"
                values="28;44;72;28"
                dur="5.5s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="x2"
                values="100;40;96;100"
                dur="5.5s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="y2"
                values="104;96;48;104"
                dur="5.5s"
                repeatCount="indefinite"
              />
            </linearGradient>
          </defs>

          <ellipse cx="46" cy="15" rx="9" ry="5.5" fill="#8aab7e" transform="rotate(-32 46 15)" />
          <ellipse cx="74" cy="15" rx="9" ry="5.5" fill="#8aab7e" transform="rotate(32 74 15)" />

          <path
            fill={`url(#${gradId})`}
            d="M60 23c-20 0-35 16-36 37-1 13 5 26 16 33 3 2 6.5 3 10 3 19 0 35-14 36-34 0-11-5-21-13-27-2-1.5-5-2.5-8-7 1.5-5.5 6-9.5 11.5-11 2.5-.8 5-.5 7.5 0z"
          />
          <path
            fill={`url(#${gradId})`}
            d="M60 51c-4.2-6-11.5-5.2-14.2 1.5-2 5.2.8 10.8 6.5 12.6 2.6.9 5.5.7 8-.8 6.2-3.8 8.2-9.5 6-12.2-1-1.6-3-3-6-2.6-8.2 1.4-4.2 4.8-7 9-6.2z"
          />

          <path
            fill="none"
            stroke="#f0b898"
            strokeWidth="3.25"
            strokeLinejoin="round"
            strokeLinecap="round"
            d="M60 23c-20 0-35 16-36 37-1 13 5 26 16 33 3 2 6.5 3 10 3 19 0 35-14 36-34 0-11-5-21-13-27-2-1.5-5-2.5-8-7 1.5-5.5 6-9.5 11.5-11 2.5-.8 5-.5 7.5 0z"
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
