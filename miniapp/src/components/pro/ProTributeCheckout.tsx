import { useTranslation } from "react-i18next";
import { useMe } from "../../hooks/useMe";
import { resolveTributeProUrls } from "../../lib/tributeProUrls";
import { ProTributeButton } from "./ProTributeButton";

type Props = {
  source: string;
};

export function ProTributeCheckout({ source }: Props) {
  const { t } = useTranslation();
  const { me } = useMe();
  const urls = resolveTributeProUrls(me.tributeProUrls ?? me.tributeProUrl);

  if (urls.length <= 1) {
    return <ProTributeButton source={source}>{t("pro.buyTribute")}</ProTributeButton>;
  }

  return (
    <div className="pro-tribute-options">
      {urls.map((url, index) => (
        <ProTributeButton
          key={url}
          url={url}
          source={`${source}-${index + 1}`}
          variant={index === 0 ? "pro" : "channel"}
        >
          {index === 0 ? t("pro.buyTribute") : t("liteCrew.buyBtn")}
        </ProTributeButton>
      ))}
    </div>
  );
}
