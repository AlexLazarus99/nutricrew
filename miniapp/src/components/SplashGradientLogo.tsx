import type { CSSProperties } from "react";

const LOGO_SRC = "/splash/nutricrew-logo.png";

type SplashGradientLogoProps = {
  width?: number;
};

/**
 * Splash logo from brand image + flowing gradient (masked to logo shape).
 */
export function SplashGradientLogo({ width }: SplashGradientLogoProps) {
  const style = width
    ? ({ "--splash-logo-width": `${width}px` } as CSSProperties)
    : undefined;

  return (
    <div className="splash-brand-logo" style={style}>
      <div className="splash-brand-logo__reveal">
        <div className="splash-brand-logo__frame">
          <div
            className="splash-brand-logo__gradient"
            style={
              {
                WebkitMaskImage: `url(${LOGO_SRC})`,
                maskImage: `url(${LOGO_SRC})`,
              } as CSSProperties
            }
            aria-hidden
          />
          <img
            className="splash-brand-logo__img"
            src={LOGO_SRC}
            width={512}
            height={512}
            alt=""
            decoding="async"
            draggable={false}
          />
        </div>
      </div>
      <span className="visually-hidden">NutriCrew</span>
    </div>
  );
}
