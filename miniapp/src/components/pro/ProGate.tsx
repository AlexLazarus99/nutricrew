import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useMe } from "../../hooks/useMe";
import { ProTributeCheckout } from "./ProTributeCheckout";
import { ProFeatureShowcase } from "./ProFeatureShowcase";

type Props = {
  titleKey: string;
  descKey?: string;
  source: string;
  children: ReactNode;
};

export function ProGate({ titleKey, descKey, source, children }: Props) {
  const { t } = useTranslation();
  const { me } = useMe();

  if (me.pro?.isPro) {
    return <>{children}</>;
  }

  return (
    <section className="stack pro-gate-page">
      <div className="card pro-gate">
        <span className="pro-gate__badge">⭐ Pro</span>
        <h2 className="pro-gate__title">{t(titleKey)}</h2>
        <p className="pro-gate__lock" aria-hidden>
          🔒
        </p>
        {descKey ? <p className="pro-gate__desc muted">{t(descKey)}</p> : null}
        <ul className="pro-gate__features">
          <li>{t("pro.featureCoach")}</li>
          <li>{t("pro.featureDeficit")}</li>
          <li>{t("pro.featurePlateReview")}</li>
        </ul>
        <ProFeatureShowcase compact />
        <ProTributeCheckout source={source} />
        <p className="pro-gate__hint muted small">{t("pro.tributeHint")}</p>
      </div>
    </section>
  );
}
