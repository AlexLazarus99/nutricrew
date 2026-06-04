import type { CSSProperties } from "react";
import { BRAND_PEACH_SRC, BRAND_PEACH_SRC_2X } from "./BrandPeachIcon";

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
            src={BRAND_PEACH_SRC}
            srcSet={`${BRAND_PEACH_SRC} 1x, ${BRAND_PEACH_SRC_2X} 2x`}
            sizes="(max-width: 480px) 53vw, 200px"
            width={410}
            height={481}
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
