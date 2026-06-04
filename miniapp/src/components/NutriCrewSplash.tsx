import { useTranslation } from "react-i18next";
import { NutriCrewMark } from "./NutriCrewMark";

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
        <NutriCrewMark size={112} showWordmark animated />
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
