import { FormEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import type { DiaryMealEntry } from "../../api/client";

type Props = {
  meal: DiaryMealEntry;
  onClose: () => void;
  onSave: (patch: {
    description: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }) => Promise<void>;
  onDelete: () => Promise<void>;
};

export function MealEditModal({ meal, onClose, onSave, onDelete }: Props) {
  const { t } = useTranslation();
  const [description, setDescription] = useState(meal.description);
  const [calories, setCalories] = useState(String(meal.calories));
  const [protein, setProtein] = useState(String(meal.protein));
  const [carbs, setCarbs] = useState(String(meal.carbs));
  const [fat, setFat] = useState(String(meal.fat));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await onSave({
        description: description.trim(),
        calories: Number(calories),
        protein: Number(protein),
        carbs: Number(carbs),
        fat: Number(fat),
      });
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!window.confirm(t("diary.deleteConfirm"))) return;
    setBusy(true);
    try {
      await onDelete();
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <form className="card meal-edit-modal" onSubmit={(e) => void submit(e)}>
        <h3>{t("diary.editMeal")}</h3>
        <label className="stack gap-xs">
          <span>{t("log.description")}</span>
          <input value={description} onChange={(e) => setDescription(e.target.value)} required />
        </label>
        <div className="meal-edit-macros">
          <label>
            {t("log.calories")}
            <input type="number" value={calories} onChange={(e) => setCalories(e.target.value)} />
          </label>
          <label>
            {t("log.protein")}
            <input type="number" value={protein} onChange={(e) => setProtein(e.target.value)} />
          </label>
          <label>
            {t("log.carbs")}
            <input type="number" value={carbs} onChange={(e) => setCarbs(e.target.value)} />
          </label>
          <label>
            {t("log.fat")}
            <input type="number" value={fat} onChange={(e) => setFat(e.target.value)} />
          </label>
        </div>
        {error && <p className="error">{error}</p>}
        <div className="meal-edit-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            {t("common.cancel")}
          </button>
          <button type="button" className="btn btn-ghost danger" disabled={busy} onClick={() => void remove()}>
            {t("diary.deleteMeal")}
          </button>
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {t("common.save")}
          </button>
        </div>
      </form>
    </div>
  );
}
