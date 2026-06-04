import { useId } from "react";
import type { CSSProperties } from "react";

type SplashGradientLogoProps = {
  peachSize?: number;
};

/** Heart-shaped brand peach + animated inner gradient shimmer */
export function SplashGradientLogo({ peachSize }: SplashGradientLogoProps) {
  const uid = useId().replace(/:/g, "");
  const clipLeftId = `peach-left-${uid}`;
  const clipPeachId = `peach-shape-${uid}`;
  const bodyGradId = `peach-body-grad-${uid}`;
  const pitGradId = `peach-pit-grad-${uid}`;

  const style = peachSize
    ? ({ "--splash-peach-size": `${peachSize}px` } as CSSProperties)
    : undefined;

  const peachBody =
    "M60 100 C34 92 18 72 22 52 C24 34 38 22 50 19 C54 17 57 26 60 30 C63 26 66 17 70 19 C82 22 96 34 98 52 C102 72 86 92 60 100 Z";
  const peachPit =
    "M60 76 C54 70 46 72 44 80 C43 88 52 94 60 96 C68 94 77 88 76 80 C74 72 66 70 60 76 Z";

  return (
    <div className="splash-brand-logo" style={style}>
      <div className="splash-brand-logo__reveal">
        <svg
          className="splash-peach-svg"
          viewBox="0 0 120 115"
          xmlns="http://www.w3.org/2000/svg"
          role="img"
          aria-label="NutriCrew"
        >
          <defs>
            <clipPath id={clipLeftId}>
              <rect x="0" y="0" width="61" height="115" />
            </clipPath>
            <clipPath id={clipPeachId}>
              <path d={peachBody} />
            </clipPath>

            <linearGradient
              id={bodyGradId}
              gradientUnits="userSpaceOnUse"
              x1="22"
              y1="24"
              x2="98"
              y2="100"
            >
              <stop offset="0%" stopColor="#fff5ee" />
              <stop offset="28%" stopColor="#f5c4a0" />
              <stop offset="52%" stopColor="#b8e0c8" />
              <stop offset="74%" stopColor="#f9a886" />
              <stop offset="100%" stopColor="#d8f2e4" />
              <animate
                attributeName="x1"
                values="22;88;30;22"
                dur="5.5s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="y1"
                values="24;40;72;24"
                dur="5.5s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="x2"
                values="98;42;94;98"
                dur="5.5s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="y2"
                values="100;92;48;100"
                dur="5.5s"
                repeatCount="indefinite"
              />
            </linearGradient>

            <linearGradient
              id={pitGradId}
              gradientUnits="userSpaceOnUse"
              x1="44"
              y1="72"
              x2="76"
              y2="96"
            >
              <stop offset="0%" stopColor="#ffc9b8" />
              <stop offset="50%" stopColor="#f7946d" />
              <stop offset="100%" stopColor="#f9a886" />
              <animate
                attributeName="x1"
                values="44;68;48;44"
                dur="4.2s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="y1"
                values="72;78;88;72"
                dur="4.2s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="x2"
                values="76;52;72;76"
                dur="4.2s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="y2"
                values="96;90;80;96"
                dur="4.2s"
                repeatCount="indefinite"
              />
            </linearGradient>
          </defs>

          <g className="splash-peach-leaves">
            <ellipse cx="47" cy="13" rx="9" ry="5" fill="#a8b89f" transform="rotate(-36 47 13)" />
            <ellipse cx="73" cy="13" rx="9" ry="5" fill="#a8b89f" transform="rotate(36 73 13)" />
            <path d="M60 17 L60 24" stroke="#95a892" strokeWidth="2" strokeLinecap="round" />
          </g>

          <g clipPath={`url(#${clipPeachId})`}>
            <path fill="#f7946d" d={peachBody} clipPath={`url(#${clipLeftId})`} />
            <path fill="#fde2cc" d={peachBody} />
            <path
              className="splash-peach-shimmer"
              fill={`url(#${bodyGradId})`}
              d={peachBody}
            />
          </g>

          <path fill="#f9a886" d={peachPit} />
          <path className="splash-peach-shimmer" fill={`url(#${pitGradId})`} d={peachPit} />

          <path
            fill="none"
            stroke="#f0b898"
            strokeWidth="3"
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
