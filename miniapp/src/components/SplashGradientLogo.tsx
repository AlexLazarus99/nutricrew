import type { CSSProperties } from "react";

const PEACH_SRC = "/splash/nutricrew-peach.png";

type SplashGradientLogoProps = {
  peachSize?: number;
};

/** Brand peach from logo artwork (transparent PNG) + animated gradient */
export function SplashGradientLogo({ peachSize }: SplashGradientLogoProps) {
  const style = peachSize
    ? ({ "--splash-peach-size": `${peachSize}px` } as CSSProperties)
    : undefined;

  return (
    <div className="splash-brand-logo" style={style}>
      <div className="splash-brand-logo__reveal">
        <div className="splash-peach-mark">
          <div className="splash-peach-mark__shimmer" aria-hidden />
          <img
            className="splash-peach-mark__art"
            src={PEACH_SRC}
            width={1024}
            height={593}
            alt=""
            decoding="async"
            draggable={false}
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
