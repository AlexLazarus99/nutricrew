import { useTranslation } from "react-i18next";
import { WaterWidget } from "../wellness/WaterWidget";

type Props = {
  onScan: () => void;
  onPhoto: () => void;
  scanning?: boolean;
};

export function FoodDayActions({ onScan, onPhoto, scanning }: Props) {
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
          <span className="food-day-actions__icon" aria-hidden>
            📷
          </span>
          <span>{t("log.barcodeScan")}</span>
        </button>
        <button
          type="button"
          className="food-day-actions__btn food-day-actions__btn--photo"
          onClick={onPhoto}
          disabled={scanning}
        >
          <span className="food-day-actions__icon" aria-hidden>
            🍽
          </span>
          <span>{t("log.takePhoto")}</span>
        </button>
      </div>
      <WaterWidget />
    </div>
  );
}
