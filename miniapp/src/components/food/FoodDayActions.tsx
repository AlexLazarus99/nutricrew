import { useTranslation } from "react-i18next";
import { WaterWidget } from "../wellness/WaterWidget";
import { StepsWidget } from "../wellness/StepsWidget";
import { FoodActionBadge } from "./FoodActionBadge";

type Props = {
  onScan: () => void;
  onPhoto: () => void;
  scanning?: boolean;
  photoOpen?: boolean;
};

export function FoodDayActions({ onScan, onPhoto, scanning, photoOpen }: Props) {
  const { t } = useTranslation();

  return (
    <div className="food-day-actions card">
      <h3 className="food-day-actions__title">{t("log.dayHubTitle")}</h3>
      <div className="food-day-actions__grid">
        <button
          type="button"
          className="food-day-actions__btn food-day-actions__btn--scan"
          onClick={onScan}
          disabled={scanning}
        >
          <FoodActionBadge kind="scan" active={scanning} />
          <span>{t("log.barcodeScan")}</span>
        </button>
        <button
          type="button"
          className="food-day-actions__btn food-day-actions__btn--photo"
          onClick={onPhoto}
          disabled={scanning}
        >
          <FoodActionBadge kind="photo" active={photoOpen} />
          <span>{t("log.takePhoto")}</span>
        </button>
      </div>
      <WaterWidget />
      <StepsWidget />
    </div>
  );
}
