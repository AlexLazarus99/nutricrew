import { useTranslation } from "react-i18next";
import type { DietId } from "../../data/wellness/catalog";
import { dietPhotoUrl } from "../../data/wellness/dietPhotos";

type Props = {
  id: DietId;
  className?: string;
};

export function DietPhoto({ id, className = "" }: Props) {
  const { t } = useTranslation();

  return (
    <img
      src={dietPhotoUrl(id)}
      alt={t(`wellness.diets.${id}.name`)}
      className={`wellness-illustration wellness-photo diet-photo ${className}`.trim()}
      loading="lazy"
      decoding="async"
      width={400}
      height={300}
    />
  );
}
