import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FoodSectionNav } from "../components/food/FoodSectionNav";
import { FoodLogHero } from "../components/food/FoodLogHero";
import { StepsWidget } from "../components/wellness/StepsWidget";
import { WorkoutsPanel } from "../components/wellness/WorkoutsPanel";
import { useMe } from "../hooks/useMe";
import { localDayBounds } from "../lib/diaryTarget";

import { intlLocaleTag } from "../lib/formatLocale";

function formatDayLabel(date: Date, locale: string): string {
  return date.toLocaleDateString(intlLocaleTag(locale), {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function shiftDay(date: Date, delta: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + delta);
}

export function StepsPage() {
  const { t, i18n } = useTranslation();
  const { me } = useMe();
  const [day, setDay] = useState(() => new Date());
  const [refreshKey, setRefreshKey] = useState(0);

  const isToday =
    localDayBounds(day).dayStart.getTime() === localDayBounds(new Date()).dayStart.getTime();

  return (
    <section className="stack steps-page">
      <FoodSectionNav />
      <FoodLogHero
        progress={me.progress}
        titleKey="steps.pageTitle"
        subtitleKey="steps.pageHint"
      />

      <div className="card diary-section diary-section--picker">
        <div className="diary-day-picker">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setDay((d) => shiftDay(d, -1))}
            aria-label={t("diary.prevDay")}
          >
            ←
          </button>
          <div className="diary-day-label">
            <strong>{formatDayLabel(day, i18n.language)}</strong>
            {isToday && <span className="diary-today-badge">{t("diary.today")}</span>}
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setDay((d) => shiftDay(d, 1))}
            disabled={isToday}
            aria-label={t("diary.nextDay")}
          >
            →
          </button>
        </div>
      </div>

      <StepsWidget date={day} readOnly={!isToday} refreshKey={refreshKey} />
      <WorkoutsPanel
        date={day}
        readOnly={!isToday}
        refreshKey={refreshKey}
        onUpdated={() => setRefreshKey((k) => k + 1)}
      />
    </section>
  );
}
