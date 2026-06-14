import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../../api/client";
import { localDayBounds } from "../../lib/diaryTarget";
import { useAppPreferences } from "../../hooks/useAppPreferences";
import { useHealthStepsSync } from "../../hooks/useHealthStepsSync";
import { healthSyncSupported } from "../../lib/health/syncHealthSteps";
import { detectHealthPlatform } from "../../lib/health/nativeHealth";
import { isGoogleFitConfigured } from "../../lib/health/googleFit";
import {
  isStepTrackingEnabled,
  setStepTrackingEnabled,
  useMotionSteps,
} from "../../hooks/useMotionSteps";

type Props = {
  date?: Date;
  readOnly?: boolean;
  refreshKey?: number;
};

const GOAL_PRESETS = [5000, 8000, 10000, 12000];

function healthSourceLabel(source: string | null | undefined, t: (k: string) => string) {
  if (!source) return null;
  if (source === "apple_health") return t("steps.sourceApple");
  if (source === "health_connect") return t("steps.sourceHealthConnect");
  if (source === "google_fit") return t("steps.sourceGoogleFit");
  return source;
}

function healthSyncErrorMessage(error: string, t: (k: string) => string) {
  if (error === "APPLE_HEALTH_UNAVAILABLE") return t("steps.healthAppleUnavailable");
  if (error === "HEALTH_PERMISSION_DENIED") return t("steps.healthPermissionDenied");
  if (error === "HEALTH_SYNC_UNAVAILABLE") return t("steps.healthSyncUnavailable");
  return t("steps.healthSyncError");
}

function showHealthSyncAlert(message: string) {
  const tg = window.Telegram?.WebApp as
    | { showAlert?: (msg: string) => void; HapticFeedback?: { notificationOccurred?: (t: string) => void } }
    | undefined;
  tg?.HapticFeedback?.notificationOccurred?.("error");
  if (tg?.showAlert) {
    tg.showAlert(message);
    return;
  }
  window.alert(message);
}

export function StepsWidget({ date, readOnly = false, refreshKey = 0 }: Props) {
  const { t } = useTranslation();
  const { prefs } = useAppPreferences();
  const [steps, setSteps] = useState(0);
  const [goal, setGoal] = useState(8000);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [tracking, setTracking] = useState(isStepTrackingEnabled);
  const [showGoals, setShowGoals] = useState(false);
  const [pulse, setPulse] = useState(false);
  const [healthSource, setHealthSource] = useState<string | null>(null);
  const [stepsXpEarned, setStepsXpEarned] = useState(0);
  const [maxStepsXp, setMaxStepsXp] = useState(80);
  const [xpToast, setXpToast] = useState<number | null>(null);

  const dateKey = date
    ? localDayBounds(date).dayStart.toISOString()
    : undefined;

  const isToday = !date || localDayBounds(date).dayStart.getTime() === localDayBounds(new Date()).dayStart.getTime();
  const healthLinked = Boolean(healthSource);
  const motionAllowed = tracking && isToday && !readOnly && !healthLinked;

  const applyStepsResponse = useCallback((res: Awaited<ReturnType<typeof api.getSteps>>) => {
    setSteps(res.steps);
    setGoal(res.goalSteps);
    setDone(res.done);
    setHealthSource(res.healthSource ?? null);
    setStepsXpEarned(res.stepsXpEarnedToday ?? 0);
    setMaxStepsXp(res.maxStepsXpToday ?? 80);
    if (res.stepsXpGrantedNow && res.stepsXpGrantedNow > 0) {
      setXpToast(res.stepsXpGrantedNow);
      window.setTimeout(() => setXpToast(null), 3200);
    }
  }, []);

  const load = useCallback(async () => {
    try {
      const res = await api.getSteps(dateKey);
      applyStepsResponse(res);
    } catch {
      /* offline */
    }
  }, [dateKey, applyStepsResponse]);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  const onHealthSynced = useCallback(
    (xp?: number) => {
      void load();
      if (xp && xp > 0) {
        setXpToast(xp);
        window.setTimeout(() => setXpToast(null), 3200);
      }
    },
    [load],
  );

  const { sync: syncHealth, syncing, lastError } = useHealthStepsSync(
    isToday && !readOnly,
    onHealthSynced,
  );

  const syncSteps = useCallback(
    async (delta: number) => {
      if (!isToday || readOnly || delta <= 0 || healthLinked) return;
      try {
        const res = await api.addSteps(delta);
        applyStepsResponse(res);
      } catch {
        /* offline */
      }
    },
    [isToday, readOnly, healthLinked, applyStepsResponse],
  );

  useMotionSteps(motionAllowed, syncSteps);

  async function add(delta: number) {
    if (readOnly || busy || healthLinked) return;
    setBusy(true);
    try {
      const res = await api.addSteps(delta);
      applyStepsResponse(res);
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
      applyStepsResponse(res);
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

  async function handleHealthSync() {
    const result = await syncHealth();
    if (result?.ok) {
      await load();
      return;
    }
    if (result?.error) {
      showHealthSyncAlert(healthSyncErrorMessage(result.error, t));
    }
  }

  const pct = Math.min(100, goal > 0 ? (steps / goal) * 100 : 0);
  const xpPct = Math.min(100, maxStepsXp > 0 ? (stepsXpEarned / maxStepsXp) * 100 : 0);
  const ringR = 36;
  const ringC = 2 * Math.PI * ringR;
  const dash = (pct / 100) * ringC;
  const platform = detectHealthPlatform();
  const canHealthSync = healthSyncSupported() || isGoogleFitConfigured() || platform !== "other";

  return (
    <div
      className={`steps-widget${pulse ? " steps-widget--pulse" : ""}${done ? " steps-widget--done" : ""}${prefs.reduceMotion ? " steps-widget--static" : ""}`}
    >
      {xpToast != null && (
        <p className="steps-widget__xp-toast" role="status">
          +{xpToast} XP
        </p>
      )}
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
          <p className="steps-widget__xp muted small">
            {t("steps.xpProgress", {
              earned: stepsXpEarned,
              max: maxStepsXp,
            })}
          </p>
          <div className="steps-widget__xp-bar" aria-hidden="true">
            <span style={{ width: `${xpPct}%` }} />
          </div>
          {healthSource && (
            <p className="steps-widget__source muted small">
              {t("steps.syncedFrom", { source: healthSourceLabel(healthSource, t) })}
            </p>
          )}
          {done && <p className="steps-widget__done-badge">{t("steps.goalDone")}</p>}

          {!readOnly && (
            <>
              {isToday && canHealthSync && (
                <button
                  type="button"
                  className={`btn btn-primary btn-sm steps-widget__health${healthLinked ? " steps-widget__health--on" : ""}`}
                  disabled={syncing || busy}
                  onClick={() => void handleHealthSync()}
                >
                  {syncing
                    ? t("steps.healthSyncing")
                    : healthLinked
                      ? t("steps.healthResync")
                      : platform === "ios"
                        ? t("steps.healthSyncApple")
                        : t("steps.healthSync")}
                </button>
              )}
              {lastError && (
                <p className="steps-widget__error small" role="alert">
                  {healthSyncErrorMessage(lastError, t)}
                </p>
              )}
              {isToday && platform === "ios" && !healthLinked && !lastError && (
                <p className="steps-widget__hint muted small">{t("steps.healthIosHint")}</p>
              )}

              <div className="steps-widget__actions">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm steps-widget__btn"
                  disabled={busy || healthLinked}
                  onClick={() => void add(500)}
                >
                  +500
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm steps-widget__btn"
                  disabled={busy || healthLinked}
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

              {isToday && typeof DeviceMotionEvent !== "undefined" && !healthLinked && (
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
