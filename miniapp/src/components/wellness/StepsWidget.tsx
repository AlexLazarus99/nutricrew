import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../../api/client";
import { localDayBounds } from "../../lib/diaryTarget";
import { useAppPreferences } from "../../hooks/useAppPreferences";
import {
  isStepTrackingEnabled,
  setStepTrackingEnabled,
  useMotionSteps,
} from "../../hooks/useMotionSteps";

type Props = {
  date?: Date;
  readOnly?: boolean;
};

const GOAL_PRESETS = [5000, 8000, 10000, 12000];

export function StepsWidget({ date, readOnly = false }: Props) {
  const { t } = useTranslation();
  const { prefs } = useAppPreferences();
  const [steps, setSteps] = useState(0);
  const [goal, setGoal] = useState(8000);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [tracking, setTracking] = useState(isStepTrackingEnabled);
  const [showGoals, setShowGoals] = useState(false);
  const [pulse, setPulse] = useState(false);

  const dateKey = date
    ? localDayBounds(date).dayStart.toISOString()
    : undefined;

  const isToday = !date || localDayBounds(date).dayStart.getTime() === localDayBounds(new Date()).dayStart.getTime();

  const load = useCallback(async () => {
    try {
      const res = await api.getSteps(dateKey);
      setSteps(res.steps);
      setGoal(res.goalSteps);
      setDone(res.done);
    } catch {
      /* offline */
    }
  }, [dateKey]);

  useEffect(() => {
    void load();
  }, [load]);

  const syncSteps = useCallback(
    async (delta: number) => {
      if (!isToday || readOnly || delta <= 0) return;
      try {
        const res = await api.addSteps(delta);
        setSteps(res.steps);
        setGoal(res.goalSteps);
        setDone(res.done);
      } catch {
        /* offline */
      }
    },
    [isToday, readOnly],
  );

  useMotionSteps(tracking && isToday && !readOnly, syncSteps);

  async function add(delta: number) {
    if (readOnly || busy) return;
    setBusy(true);
    try {
      const res = await api.addSteps(delta);
      setSteps(res.steps);
      setGoal(res.goalSteps);
      setDone(res.done);
      if (!prefs.reduceMotion) {
        setPulse(true);
        window.setTimeout(() => setPulse(false), 500);
      }
    } finally {
      setBusy(false);
    }
  }

  async function pickGoal(goalSteps: number) {
    if (readOnly || busy) return;
    setBusy(true);
    try {
      const res = await api.setStepsGoal(goalSteps);
      setSteps(res.steps);
      setGoal(res.goalSteps);
      setDone(res.done);
      setShowGoals(false);
    } finally {
      setBusy(false);
    }
  }

  function toggleTracking() {
    const next = !tracking;
    setTracking(next);
    setStepTrackingEnabled(next);
  }

  const pct = Math.min(100, goal > 0 ? (steps / goal) * 100 : 0);
  const ringR = 36;
  const ringC = 2 * Math.PI * ringR;
  const dash = (pct / 100) * ringC;

  return (
    <div
      className={`steps-widget${pulse ? " steps-widget--pulse" : ""}${done ? " steps-widget--done" : ""}${prefs.reduceMotion ? " steps-widget--static" : ""}`}
    >
      <div className="steps-widget__layout">
        <div className="steps-widget__ring-wrap" aria-hidden="true">
          <svg className="steps-widget__ring" viewBox="0 0 88 88">
            <circle className="steps-widget__ring-bg" cx="44" cy="44" r={ringR} />
            <circle
              className="steps-widget__ring-fill"
              cx="44"
              cy="44"
              r={ringR}
              strokeDasharray={`${dash} ${ringC}`}
              transform="rotate(-90 44 44)"
            />
          </svg>
          <span className="steps-widget__ring-icon">👟</span>
        </div>

        <div className="steps-widget__body">
          <div className="steps-widget__head">
            <h3>{t("steps.title")}</h3>
            <span className="steps-widget__pct">{Math.round(pct)}%</span>
          </div>
          <p className="steps-widget__amount">
            <strong>{steps.toLocaleString()}</strong>
            <span className="muted">
              {" "}
              / {goal.toLocaleString()} {t("steps.unit")}
            </span>
          </p>
          {done && <p className="steps-widget__done-badge">{t("steps.goalDone")}</p>}

          {!readOnly && (
            <>
              <div className="steps-widget__actions">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm steps-widget__btn"
                  disabled={busy}
                  onClick={() => void add(500)}
                >
                  +500
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm steps-widget__btn"
                  disabled={busy}
                  onClick={() => void add(1000)}
                >
                  +1000
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm steps-widget__btn"
                  disabled={busy}
                  onClick={() => setShowGoals((v) => !v)}
                >
                  {t("steps.goal")}
                </button>
              </div>

              {isToday && typeof DeviceMotionEvent !== "undefined" && (
                <button
                  type="button"
                  className={`btn btn-sm steps-widget__track${tracking ? " steps-widget__track--on" : ""}`}
                  onClick={toggleTracking}
                >
                  {tracking ? t("steps.trackingOn") : t("steps.trackingOff")}
                </button>
              )}

              {showGoals && (
                <div className="steps-widget__goals">
                  {GOAL_PRESETS.map((g) => (
                    <button
                      key={g}
                      type="button"
                      className={`feature-chip${goal === g ? " active" : ""}`}
                      disabled={busy}
                      onClick={() => void pickGoal(g)}
                    >
                      {g.toLocaleString()}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
