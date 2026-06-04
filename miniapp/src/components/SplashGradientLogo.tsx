import { useId } from "react";
import type { CSSProperties } from "react";

type SplashGradientLogoProps = {
  size?: number;
  showWordmark?: boolean;
};

/** Minimal apple silhouette (Apple-like curves) + flowing in-logo gradient */
export function SplashGradientLogo({ size = 152, showWordmark = true }: SplashGradientLogoProps) {
  const uid = useId().replace(/:/g, "");
  const gradId = `splash-grad-${uid}`;

  return (
    <div
      className="splash-apple-logo"
      style={{ "--splash-logo-size": `${size}px` } as CSSProperties}
    >
      <div className="splash-apple-logo__reveal" aria-hidden>
        <div className="splash-apple-logo__icon">
        <svg viewBox="0 0 96 112" xmlns="http://www.w3.org/2000/svg" role="presentation">
          <defs>
            <linearGradient
              id={gradId}
              gradientUnits="userSpaceOnUse"
              x1="8"
              y1="4"
              x2="88"
              y2="108"
            >
              <stop offset="0%" stopColor="#d4fce6">
                <animate
                  attributeName="stop-color"
                  values="#d4fce6;#9ed4f0;#b8f0d0;#d4fce6"
                  dur="3.2s"
                  repeatCount="indefinite"
                />
              </stop>
              <stop offset="45%" stopColor="#5fb88a">
                <animate
                  attributeName="stop-color"
                  values="#5fb88a;#7ec4a0;#4a9e72;#5fb88a"
                  dur="3.2s"
                  repeatCount="indefinite"
                />
              </stop>
              <stop offset="100%" stopColor="#9ec8e8">
                <animate
                  attributeName="stop-color"
                  values="#9ec8e8;#c5f0d8;#8eb8d8;#9ec8e8"
                  dur="3.2s"
                  repeatCount="indefinite"
                />
              </stop>
              <animate
                attributeName="x1"
                values="8;64;20;8"
                dur="3.6s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="y1"
                values="4;24;56;4"
                dur="3.6s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="x2"
                values="88;32;92;88"
                dur="3.6s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="y2"
                values="108;100;48;108"
                dur="3.6s"
                repeatCount="indefinite"
              />
            </linearGradient>
          </defs>
          <path
            fill={`url(#${gradId})`}
            fillRule="evenodd"
            clipRule="evenodd"
            d="M48 8c-2.2 0-4.3.6-6.1 1.6-2.6-3.6-7.8-4.6-11.7-2.6-3.9 2-4.9 6.2-2.6 9.4-5.2 3.4-8.4 9.2-8.4 15.6 0 12.4 10 22.4 22.4 22.4 7 0 13.2-3.2 17.3-8.3 1.4 1.1 3.1 1.7 4.9 1.7 4.7 0 8.5-3.8 8.5-8.5 0-3.7-2.3-6.8-5.6-8 2.8-4 4.4-8.8 4.4-14 0-12.4-10-22.4-22.4-22.4zm14.2 38.8c3.4 0 6.2 2.8 6.2 6.2s-2.8 6.2-6.2 6.2c-2.7 0-5-1.7-5.9-4.1 2.1-.9 3.6-3.1 3.6-5.7 0-2.6-1.5-4.8-3.6-5.7.9-2.4 3.2-4.1 5.9-4.1z"
          />
        </svg>
        </div>
      </div>
      {showWordmark ? (
        <p className="splash-apple-wordmark" aria-hidden>
          <span className="splash-apple-word-nutri">Nutri</span>
          <span className="splash-apple-word-crew">Crew</span>
        </p>
      ) : null}
      <span className="visually-hidden">NutriCrew</span>
    </div>
  );
}
