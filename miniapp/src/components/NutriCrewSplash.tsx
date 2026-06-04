import type { CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import { NutriCrewMark } from "./NutriCrewMark";

const LIGHT_RAY_COUNT = 14;

type Props = {
  slow?: boolean;
};

export function NutriCrewSplash({ slow = false }: Props) {
  const { t } = useTranslation();

  return (
    <div className="nutricrew-splash" role="status" aria-live="polite" aria-busy="true">
      <div className="splash-bg" aria-hidden>
        <span className="splash-orb splash-orb-1" />
        <span className="splash-orb splash-orb-2" />
      </div>

      <div className="splash-card">
        <div className="splash-logo-stage">
          <div className="splash-light-burst" aria-hidden>
            {Array.from({ length: LIGHT_RAY_COUNT }, (_, i) => (
              <span
                key={i}
                className="splash-light-ray"
                style={
                  {
                    "--ray-deg": `${(360 / LIGHT_RAY_COUNT) * i}deg`,
                    "--ray-i": i,
                  } as CSSProperties
                }
              />
            ))}
          </div>
          <span className="splash-logo-bloom" aria-hidden />
          <NutriCrewMark size={120} showWordmark splash animated />
        </div>
        <p className="splash-tagline">{t("splash.tagline")}</p>
      </div>

      <div className="splash-loader">
        <div className="splash-loader-track" aria-hidden>
          <div className="splash-loader-bar" />
        </div>
        <p className="splash-status">{t("splash.loading")}</p>
        {slow ? <p className="splash-hint">{t("common.loadingSlow")}</p> : null}
      </div>
    </div>
  );
}
