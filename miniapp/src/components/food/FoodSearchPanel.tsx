import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { api, type FoodSearchResult } from "../../api/client";

type Props = {
  onSelect: (item: FoodSearchResult) => void;
};

export function FoodSearchPanel({ onSelect }: Props) {
  const { t } = useTranslation();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<FoodSearchResult[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (q.trim().length < 3) {
      setResults([]);
      return;
    }
    const timer = window.setTimeout(() => {
      setBusy(true);
      api
        .searchFoods(q.trim())
        .then((r) => setResults(r.results))
        .catch(() => setResults([]))
        .finally(() => setBusy(false));
    }, 350);
    return () => window.clearTimeout(timer);
  }, [q]);

  return (
    <div className="card food-search-panel">
      <h3>{t("log.foodSearch")}</h3>
      <input
        type="search"
        placeholder={t("log.foodSearchPlaceholder")}
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      {busy && <p className="muted small">{t("common.loading")}</p>}
      <ul className="food-search-results">
        {results.map((r) => (
          <li key={r.id + r.name}>
            <button type="button" className="food-search-item" onClick={() => onSelect(r)}>
              <strong>{r.name}</strong>
              {r.brand && <span className="muted small"> · {r.brand}</span>}
              <span className="muted small block">
                {r.calories} kcal · P{r.protein} C{r.carbs} F{r.fat}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
