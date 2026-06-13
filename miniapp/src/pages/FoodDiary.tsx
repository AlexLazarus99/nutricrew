import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api, type DiaryResponse, type DiaryMealEntry } from "../api/client";
import { FoodSectionNav } from "../components/food/FoodSectionNav";
import { MealEditModal } from "../components/food/MealEditModal";
import { useMe } from "../hooks/useMe";
import {
  calcDayBalance,
  localDayBounds,
  resolveDailyGoal,
  resolveDailyTargetKcal,
} from "../lib/diaryTarget";
import { FoodLogHero } from "../components/food/FoodLogHero";
import { WaterWidget } from "../components/wellness/WaterWidget";
import { StepsWidget } from "../components/wellness/StepsWidget";
import { Skeleton, SkeletonCard } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/EmptyState";
import { NavBadgeIcon } from "../components/nav/NavBadgeIcon";

function formatDayLabel(date: Date, locale: string): string {
  return date.toLocaleDateString(locale.startsWith("ru") ? "ru-RU" : "en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function formatTime(iso: string, locale: string): string {
  return new Date(iso).toLocaleTimeString(locale.startsWith("ru") ? "ru-RU" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function shiftDay(date: Date, delta: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + delta);
}

export function FoodDiaryPage() {
  const { t, i18n } = useTranslation();
  const { me } = useMe();
  const [day, setDay] = useState(() => new Date());
  const [data, setData] = useState<DiaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editMeal, setEditMeal] = useState<DiaryMealEntry | null>(null);

  const targetKcal = useMemo(
    () =>
      resolveDailyTargetKcal({
        weightKg: me.weightKg,
        heightCm: me.heightCm,
        age: me.age,
      }),
    [me.weightKg, me.heightCm, me.age],
  );

  const goal = resolveDailyGoal();

  const loadDiary = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { dayStart, dayEnd } = localDayBounds(day);
      const res = await api.getMealDiary(dayStart.toISOString(), dayEnd.toISOString());
      setData(res);
    } catch (err) {
      setError((err as Error).message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [day]);

  useEffect(() => {
    void loadDiary();
  }, [loadDiary]);

  const eaten = data?.totals.calories ?? 0;
  const balance =
    targetKcal != null ? calcDayBalance(targetKcal, eaten) : null;

  const isToday =
    localDayBounds(day).dayStart.getTime() === localDayBounds(new Date()).dayStart.getTime();

  return (
    <section className="stack diary-page">
      <FoodSectionNav />
      <FoodLogHero
        progress={me.progress}
        titleKey="diary.title"
        subtitleKey="diary.hint"
      />
      <WaterWidget date={day} readOnly={!isToday} />
      <StepsWidget date={day} readOnly={!isToday} />

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

      {targetKcal == null ? (
        <div className="card diary-target-card diary-target-missing diary-section">
          <h3>{t("diary.noTargetTitle")}</h3>
          <p className="muted">{t("diary.noTargetHint")}</p>
          <Link to="/guide?tab=calc" className="btn btn-primary btn-block">
            {t("diary.openCalculator")}
          </Link>
        </div>
      ) : balance ? (
        <div className="card diary-target-card diary-section">
          <div className="diary-summary-grid">
            <div>
              <span className="diary-stat-label">{t("diary.target")}</span>
              <strong className="diary-stat-value">{balance.target}</strong>
              <span className="muted small">{t("diary.kcal")}</span>
            </div>
            <div>
              <span className="diary-stat-label">{t("diary.eaten")}</span>
              <strong className="diary-stat-value">{balance.eaten}</strong>
              <span className="muted small">{t("diary.kcal")}</span>
            </div>
            <div>
              <span className="diary-stat-label">
                {balance.remaining >= 0 ? t("diary.remaining") : t("diary.over")}
              </span>
              <strong
                className={`diary-stat-value diary-stat-${balance.status}`}
              >
                {Math.abs(balance.remaining)}
              </strong>
              <span className="muted small">{t("diary.kcal")}</span>
            </div>
          </div>

          <div className="diary-progress">
            <div
              className="diary-progress-fill"
              style={{
                width: `${Math.min(100, Math.round((balance.eaten / balance.target) * 100))}%`,
              }}
            />
          </div>

          <p className={`diary-recommendation diary-rec-${balance.status}`}>
            {balance.status === "deficit" &&
              t("diary.recDeficit", {
                kcal: balance.remaining,
                goal: t(`calculator.goals.${goal}.label`),
              })}
            {balance.status === "onTrack" &&
              t("diary.recOnTrack", { goal: t(`calculator.goals.${goal}.label`) })}
            {balance.status === "surplus" &&
              t("diary.recSurplus", {
                kcal: Math.abs(balance.remaining),
                goal: t(`calculator.goals.${goal}.label`),
              })}
          </p>
        </div>
      ) : null}

      {data && data.totals.count > 0 && (
        <div className="card diary-macros-card diary-section">
          <h3>{t("diary.macrosDay")}</h3>
          <div className="diary-macros-row">
            <span>{t("log.protein")}: <strong>{data.totals.protein} g</strong></span>
            <span>{t("log.carbs")}: <strong>{data.totals.carbs} g</strong></span>
            <span>{t("log.fat")}: <strong>{data.totals.fat} g</strong></span>
          </div>
        </div>
      )}

      <div className="card diary-section diary-section--meals">
        <div className="diary-list-head">
          <h3>{t("diary.mealsTitle")}</h3>
          <Link to="/log" className="btn btn-secondary btn-sm">
            {t("diary.addMeal")}
          </Link>
        </div>

        {loading && (
          <div className="stack">
            <Skeleton lines={2} />
            <SkeletonCard />
          </div>
        )}
        {error && <p className="error">{error}</p>}

        {!loading && !error && data?.meals.length === 0 && (
          <EmptyState
            title={t("diary.empty")}
            hint={t("diary.emptyHint")}
            icon={<NavBadgeIcon kind="food" size={44} />}
            actionLabel={t("diary.addMeal")}
            actionTo="/log"
          />
        )}

        {!loading && data && data.meals.length > 0 && (
          <ul className="diary-meal-list">
            {data.meals.map((meal, index) => (
              <li
                key={meal.id}
                className="diary-meal-item diary-meal-item--editable"
                style={{ animationDelay: `${Math.min(index * 0.05, 0.35)}s` }}
                onClick={() => setEditMeal(meal)}
              >
                {meal.photoUrl ? (
                  <img src={meal.photoUrl} alt="" className="diary-meal-thumb" />
                ) : (
                  <div className="diary-meal-thumb diary-meal-thumb-placeholder" aria-hidden>
                    🍽
                  </div>
                )}
                <div className="diary-meal-body">
                  <div className="diary-meal-top">
                    <strong className="diary-meal-title">{meal.description}</strong>
                    <div className="diary-meal-badges">
                      <span className="diary-meal-points">+{meal.points}</span>
                      <span className="diary-meal-kcal">
                        {meal.calories} {t("diary.kcal")}
                      </span>
                    </div>
                  </div>
                  <p className="muted small diary-meal-meta">
                    {formatTime(meal.createdAt, i18n.language)}
                    {" · "}
                    {t("diary.mealMacros", {
                      p: meal.protein,
                      c: meal.carbs,
                      f: meal.fat,
                    })}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {editMeal && (
        <MealEditModal
          meal={editMeal}
          onClose={() => setEditMeal(null)}
          onSave={async (patch) => {
            await api.updateMeal(editMeal.id, patch);
            await loadDiary();
          }}
          onDelete={async () => {
            await api.deleteMeal(editMeal.id);
            await loadDiary();
          }}
        />
      )}
    </section>
  );
}
