import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { api, type WorkoutLogEntry } from "../../api/client";
import { localDayBounds } from "../../lib/diaryTarget";
import {
  DURATION_PRESETS,
  WORKOUT_ICONS,
  WORKOUT_TYPES,
  estimateWorkoutSteps,
  workoutSupportsDistance,
  type WorkoutType,
} from "../../lib/workoutTypes";

type Props = {
  date?: Date;
  readOnly?: boolean;
  refreshKey?: number;
  onUpdated?: () => void;
};

import { intlLocaleTag } from "../../lib/formatLocale";

function formatWorkoutTime(iso: string, locale: string) {
  return new Date(iso).toLocaleTimeString(intlLocaleTag(locale), {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function WorkoutsPanel({ date, readOnly = false, refreshKey = 0, onUpdated }: Props) {
  const { t, i18n } = useTranslation();
  const [workouts, setWorkouts] = useState<WorkoutLogEntry[]>([]);
  const [busy, setBusy] = useState(false);
  const [selectedType, setSelectedType] = useState<WorkoutType | null>(null);
  const [duration, setDuration] = useState<number>(30);
  const [distanceKm, setDistanceKm] = useState("");

  const dateKey = date ? localDayBounds(date).dayStart.toISOString() : undefined;

  const load = useCallback(async () => {
    try {
      const res = await api.getSteps(dateKey);
      setWorkouts(res.workouts ?? []);
    } catch {
      /* offline */
    }
  }, [dateKey]);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  const previewSteps =
    selectedType != null
      ? estimateWorkoutSteps(
          selectedType,
          duration,
          distanceKm.trim() ? Number(distanceKm) : undefined,
        )
      : 0;

  async function logWorkout() {
    if (readOnly || busy || !selectedType) return;
    setBusy(true);
    try {
      const km = distanceKm.trim() ? Number(distanceKm) : undefined;
      await api.logWorkout({
        type: selectedType,
        durationMinutes: duration,
        distanceKm: km != null && Number.isFinite(km) && km > 0 ? km : undefined,
        date: dateKey,
      });
      setSelectedType(null);
      setDistanceKm("");
      await load();
      onUpdated?.();
    } catch {
      /* offline */
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card workouts-panel">
      <div className="workouts-panel__head">
        <h3>{t("steps.workoutsTitle")}</h3>
        <p className="muted small">{t("steps.workoutsHint")}</p>
      </div>

      {!readOnly && (
        <>
          <div className="workouts-panel__types" role="list">
            {WORKOUT_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                role="listitem"
                className={`workouts-panel__type${selectedType === type ? " active" : ""}`}
                onClick={() => setSelectedType((prev) => (prev === type ? null : type))}
              >
                <span className="workouts-panel__type-icon" aria-hidden>
                  {WORKOUT_ICONS[type]}
                </span>
                <span>{t(`steps.workoutTypes.${type}`)}</span>
              </button>
            ))}
          </div>

          {selectedType && (
            <div className="workouts-panel__form">
              <p className="workouts-panel__form-label muted small">
                {t("steps.workoutDuration")}
              </p>
              <div className="workouts-panel__durations">
                {DURATION_PRESETS.map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    className={`feature-chip${duration === mins ? " active" : ""}`}
                    onClick={() => setDuration(mins)}
                  >
                    {t("steps.workoutMinutes", { count: mins })}
                  </button>
                ))}
              </div>

              {workoutSupportsDistance(selectedType) && (
                <label className="workouts-panel__distance">
                  <span className="muted small">{t("steps.workoutDistance")}</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.1"
                    placeholder="0"
                    value={distanceKm}
                    onChange={(e) => setDistanceKm(e.target.value)}
                  />
                  <span className="muted small">{t("steps.workoutKm")}</span>
                </label>
              )}

              <p className="workouts-panel__preview muted small">
                {t("steps.workoutStepsPreview", { steps: previewSteps.toLocaleString() })}
              </p>

              <button
                type="button"
                className="btn btn-primary btn-sm btn-block"
                disabled={busy}
                onClick={() => void logWorkout()}
              >
                {busy ? t("steps.workoutSaving") : t("steps.workoutLog")}
              </button>
            </div>
          )}
        </>
      )}

      {workouts.length > 0 ? (
        <ul className="workouts-panel__list">
          {workouts.map((item) => (
            <li key={item.id} className="workouts-panel__item">
              <span className="workouts-panel__item-icon" aria-hidden>
                {WORKOUT_ICONS[item.type as WorkoutType] ?? "🏃"}
              </span>
              <div className="workouts-panel__item-body">
                <strong>{t(`steps.workoutTypes.${item.type}`, { defaultValue: item.type })}</strong>
                <span className="muted small">
                  {t("steps.workoutEntry", {
                    minutes: item.durationMinutes,
                    steps: item.steps.toLocaleString(),
                    time: formatWorkoutTime(item.createdAt, i18n.language),
                  })}
                  {item.distanceKm != null && item.distanceKm > 0
                    ? ` · ${item.distanceKm} ${t("steps.workoutKm")}`
                    : ""}
                </span>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="workouts-panel__empty muted small">{t("steps.workoutsEmpty")}</p>
      )}
    </div>
  );
}
