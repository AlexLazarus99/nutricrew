import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  MEAL_SLOTS,
  WEEKDAYS,
  dailyTotalKcal,
  getDietWeeklyPlan,
  getMealPlanVariantNumber,
  type MealEntry,
  type MealSlot,
  type Weekday,
} from "../../data/wellness/dietMealPlans";
import type { DietId } from "../../data/wellness/catalog";
import { DishPhoto } from "./DishPhoto";
import { getCurrentWeekKey, getUtcWeekday } from "../../lib/week";

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

function MealCard({ meal, slot }: { meal: MealEntry; slot: MealSlot }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const name = t(`dishNames.${meal.dishId}`, { defaultValue: meal.dishId });
  const prefix = `dishRecipes.${meal.dishId}`;
  const ingredients = asStringArray(t(`${prefix}.ingredients`, { returnObjects: true, defaultValue: [] }));
  const steps = asStringArray(t(`${prefix}.steps`, { returnObjects: true, defaultValue: [] }));
  const hasRecipe = ingredients.length > 0 || steps.length > 0;

  return (
    <article className="card meal-card">
      <DishPhoto dishId={meal.dishId} alt={name} />
      <div className="meal-card-body">
        <span className="meal-slot-label">{t(`wellness.meals.${slot}`)}</span>
        <h4>{name}</h4>
        <span className="meal-kcal">{meal.kcal} {t("wellness.kcal")}</span>
        {hasRecipe && (
          <div className="dish-recipe">
            <button
              type="button"
              className="dish-recipe-toggle"
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
            >
              {open ? t("wellness.hideRecipe") : t("wellness.showRecipe")}
            </button>
            {open && (
              <div className="dish-recipe-content">
                {ingredients.length > 0 && (
                  <div>
                    <strong>{t("wellness.ingredients")}</strong>
                    <ul className="dish-recipe-list">
                      {ingredients.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {steps.length > 0 && (
                  <div>
                    <strong>{t("wellness.steps")}</strong>
                    <ol className="dish-recipe-list dish-recipe-steps">
                      {steps.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

type Props = {
  dietId: DietId;
};

export function WeeklyMealPlan({ dietId }: Props) {
  const { t } = useTranslation();
  const weekKey = getCurrentWeekKey();
  const plan = getDietWeeklyPlan(dietId, weekKey);
  const variantNumber = getMealPlanVariantNumber(dietId, weekKey);
  const [activeDay, setActiveDay] = useState<Weekday>(() => getUtcWeekday());

  if (!plan?.length) return null;

  const dayPlan = plan.find((d) => d.day === activeDay) ?? plan[0];

  return (
    <section className="meal-plan">
      <div className="card">
        <h3>{t("wellness.sections.mealPlan")}</h3>
        <p className="muted small">{t("wellness.mealPlanHint")}</p>
        <p className="meal-plan-week muted small">
          {t("wellness.mealPlanWeek", {
            week: weekKey,
            variant: variantNumber,
          })}
        </p>
      </div>

      <div className="meal-day-tabs" role="tablist">
        {WEEKDAYS.map((day) => (
          <button
            key={day}
            type="button"
            role="tab"
            aria-selected={activeDay === day}
            className={activeDay === day ? "active" : ""}
            onClick={() => setActiveDay(day)}
          >
            {t(`wellness.weekdays.${day}`)}
          </button>
        ))}
      </div>

      <div className="card meal-day-summary">
        <span className="wellness-badge">{t(`wellness.weekdays.${dayPlan.day}`)}</span>
        <span className="meal-day-kcal">
          {t("wellness.dailyKcal", { kcal: dailyTotalKcal(dayPlan) })}
        </span>
      </div>

      <div className="meal-cards stack">
        {MEAL_SLOTS.map((slot) => (
          <MealCard key={slot} meal={dayPlan.meals[slot]} slot={slot} />
        ))}
      </div>
    </section>
  );
}
