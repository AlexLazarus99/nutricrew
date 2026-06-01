import { useTranslation } from "react-i18next";
import type { BodyTypeId } from "../../data/wellness/catalog";
import { bodyTypePhotoUrl } from "../../data/wellness/bodyTypePhotos";

type Props = {
  id: BodyTypeId;
  className?: string;
};

export function BodyTypePhoto({ id, className = "" }: Props) {
  const { t } = useTranslation();

  return (
    <img
      src={bodyTypePhotoUrl(id)}
      alt={t(`wellness.bodyTypes.${id}.name`)}
      className={`wellness-illustration wellness-photo body-type-photo ${className}`.trim()}
      loading="lazy"
      decoding="async"
      width={400}
      height={500}
    />
  );
}
