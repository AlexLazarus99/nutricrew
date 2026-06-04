import { useId } from "react";
import type { CSSProperties } from "react";

const LOGO_SRC = "/splash/nutricrew-logo.png";

type SplashGradientLogoProps = {
  peachSize?: number;
};

/**
 * Brand peach from original artwork — white knocked out, inner gradient shimmer.
 */
export function SplashGradientLogo({ peachSize }: SplashGradientLogoProps) {
  const uid = useId().replace(/:/g, "");
  const filterId = `peach-knockout-${uid}`;

  const style = peachSize
    ? ({ "--splash-peach-size": `${peachSize}px` } as CSSProperties)
    : undefined;

  return (
    <div className="splash-brand-logo" style={style}>
      <svg width="0" height="0" aria-hidden>
        <defs>
          <filter id={filterId} colorInterpolationFilters="sRGB">
            <feColorMatrix
              type="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  -1.05 -1.05 -1.05 1.02 0"
            />
          </filter>
        </defs>
      </svg>

      <div className="splash-brand-logo__reveal">
        <div className="splash-peach-mark">
          <div
            className="splash-peach-mark__gradient"
            style={
              {
                WebkitMaskImage: `url(${LOGO_SRC})`,
                maskImage: `url(${LOGO_SRC})`,
              } as CSSProperties
            }
            aria-hidden
          />
          <img
            className="splash-peach-mark__art"
            src={LOGO_SRC}
            width={512}
            height={512}
            alt=""
            decoding="async"
            draggable={false}
            style={{ filter: `url(#${filterId})` }}
          />
        </div>

        <p className="splash-brand-wordmark" aria-hidden>
          Nutri<span className="splash-brand-wordmark-crew">Crew</span>
        </p>
      </div>
      <span className="visually-hidden">NutriCrew</span>
    </div>
  );
}
