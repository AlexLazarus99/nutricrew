import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FOOD_CATEGORIES } from "../../data/calorieQuiz/types";
import { searchFoodCatalog } from "../../lib/foodCatalogSearch";
import { macrosForPortion } from "../../lib/foodPortion";
import type { FoodCategory, FoodItem } from "../../data/calorieQuiz/types";
import type { MealAnalysisResponse } from "../../api/client";

export type CatalogMealResult = MealAnalysisResponse & {
  foodId: string;
  portionAmount: number;
};

type Props = {
  onApply: (result: CatalogMealResult) => void;
  onClose: () => void;
};

export function FoodCatalogPicker({ onApply, onClose }: Props) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<FoodCategory | "all">("all");
  const [selected, setSelected] = useState<FoodItem | null>(null);
  const [amount, setAmount] = useState("150");

  const hits = useMemo(() => {
    const results = searchFoodCatalog(query, (id) => t(`quiz.foods.${id}`), 24);
    if (category === "all") return results;
    return results.filter((hit) => hit.item.category === category);
  }, [category, query, t]);

  function selectItem(item: FoodItem) {
    setSelected(item);
    setAmount(item.unit === "ml" ? "250" : "150");
  }

  function buildPreview(item: FoodItem, portion: number): CatalogMealResult {
    const label = `${item.emoji} ${t(`quiz.foods.${item.id}`)}`;
    const macros = macrosForPortion(item, portion, label);
    return {
      ...macros,
      confidence: 0.9,
      mealType: item.category === "drinks" ? "drink" : "unknown",
      source: "catalog",
      foodId: item.id,
      portionAmount: portion,
    };
  }

  const preview = selected
    ? buildPreview(selected, Math.max(1, Number(amount) || 100))
    : null;

  function handleApply() {
    if (!preview) return;
    onApply(preview);
  }

  return (
    <div className="food-catalog-picker">
      <div className="food-catalog-picker__head">
        <h3>{t("log.catalogTitle")}</h3>
        <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>
          {t("log.liveClose")}
        </button>
      </div>

      <label>
        {t("log.catalogSearch")}
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("log.catalogSearchPlaceholder")}
          autoFocus
        />
      </label>

      <div className="feature-row food-catalog-categories">
        <button
          type="button"
          className={`feature-chip ${category === "all" ? "active" : ""}`}
          onClick={() => setCategory("all")}
        >
          {t("log.catalogAll")}
        </button>
        {FOOD_CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            className={`feature-chip ${category === cat ? "active" : ""}`}
            onClick={() => setCategory(cat)}
          >
            {t(`quiz.categories.${cat}`)}
          </button>
        ))}
      </div>

      {query.trim().length < 2 ? (
        <p className="muted small">{t("log.catalogHint")}</p>
      ) : hits.length === 0 ? (
        <p className="muted small">{t("log.catalogEmpty")}</p>
      ) : (
        <ul className="food-catalog-results">
          {hits.map(({ item }) => (
            <li key={item.id}>
              <button
                type="button"
                className={`food-catalog-result${selected?.id === item.id ? " active" : ""}`}
                onClick={() => selectItem(item)}
              >
                <span className="food-catalog-result__emoji">{item.emoji}</span>
                <span className="food-catalog-result__body">
                  <strong>{t(`quiz.foods.${item.id}`)}</strong>
                  <span className="muted small">
                    {item.calories} {t("log.catalogPer100", { unit: item.unit })}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {selected && (
        <div className="food-catalog-portion card card--inset">
          <p className="form-macros-label">{t("log.portionTitle")}</p>
          <label>
            {t("log.portionAmount", { unit: selected.unit })}
            <input
              type="number"
              min={1}
              max={3000}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </label>
          {preview && (
            <p className="muted small">
              {t("log.liveCalories", { kcal: preview.calories })} ·{" "}
              {t("log.liveMacros", {
                protein: preview.protein,
                carbs: preview.carbs,
                fat: preview.fat,
              })}
            </p>
          )}
          <button type="button" className="btn btn-primary btn-block" onClick={handleApply}>
            {t("log.liveApply")}
          </button>
        </div>
      )}
    </div>
  );
}
