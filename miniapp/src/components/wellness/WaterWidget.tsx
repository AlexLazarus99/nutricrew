import { useCallback, useEffect, useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../../api/client";
import { localDayBounds } from "../../lib/diaryTarget";
import { useAppPreferences } from "../../hooks/useAppPreferences";

type Props = {
  /** Diary day — defaults to today. */
  date?: Date;
  /** Hide add buttons (past days). */
  readOnly?: boolean;
};

const DROP_TOP = 14;
const DROP_BOTTOM = 92;
const DROP_HEIGHT = DROP_BOTTOM - DROP_TOP;

export function WaterWidget({ date, readOnly = false }: Props) {
  const { t } = useTranslation();
  const { prefs } = useAppPreferences();
  const uid = useId().replace(/:/g, "");
  const [ml, setMl] = useState(0);
  const [goal, setGoal] = useState(2000);
  const [busy, setBusy] = useState(false);
  const [splash, setSplash] = useState(false);

  const dateKey = date
    ? localDayBounds(date).dayStart.toISOString()
    : undefined;

  const load = useCallback(async () => {
    try {
      const res = await api.getWater(dateKey);
      setMl(res.ml);
      setGoal(res.goalMl);
    } catch {
      /* offline */
    }
  }, [dateKey]);

  useEffect(() => {
    void load();
  }, [load]);

  async function add(amount: number) {
    if (readOnly || busy) return;
    setBusy(true);
    try {
      const res = await api.addWater(amount);
      setMl(res.ml);
      setGoal(res.goalMl);
      if (!prefs.reduceMotion) {
        setSplash(true);
        window.setTimeout(() => setSplash(false), 650);
      }
    } finally {
      setBusy(false);
    }
  }

  const pct = Math.min(100, goal > 0 ? (ml / goal) * 100 : 0);
  const fillHeight = (pct / 100) * DROP_HEIGHT;
  const fillY = DROP_BOTTOM - fillHeight;
  const gradId = `waterGrad-${uid}`;
  const shineId = `waterShine-${uid}`;
  const clipId = `waterClip-${uid}`;

  return (
    <div
      className={`card water-widget${splash ? " water-widget--splash" : ""}${prefs.reduceMotion ? " water-widget--static" : ""}`}
    >
      <div className="water-widget__layout">
        <div className="water-widget__drop-wrap" aria-hidden="true">
          <svg className="water-widget__drop" viewBox="0 0 80 100" role="presentation">
            <defs>
              <linearGradient id={gradId} x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#1a7fc4" />
                <stop offset="45%" stopColor="#3eb8e8" />
                <stop offset="100%" stopColor="#9ee4ff" />
              </linearGradient>
              <linearGradient id={shineId} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
              </linearGradient>
              <clipPath id={clipId}>
                <path d="M40 8 C40 8 70 44 70 66 C70 82 57 93 40 93 C23 93 10 82 10 66 C10 44 40 8 40 8 Z" />
              </clipPath>
            </defs>

            <path
              className="water-widget__drop-shell"
              d="M40 8 C40 8 70 44 70 66 C70 82 57 93 40 93 C23 93 10 82 10 66 C10 44 40 8 40 8 Z"
            />

            <g clipPath={`url(#${clipId})`}>
              <rect
                className="water-widget__fill"
                x="0"
                y={fillY}
                width="80"
                height={fillHeight + 2}
                fill={`url(#${gradId})`}
              />
              {fillHeight > 6 && (
                <>
                  <ellipse
                    className="water-widget__surface"
                    cx="40"
                    cy={fillY}
                    rx="30"
                    ry="4"
                    fill={`url(#${gradId})`}
                  />
                  <path
                    className="water-widget__wave"
                    d={`M0 ${fillY + 1} Q20 ${fillY - 3} 40 ${fillY + 1} T80 ${fillY + 1} V${DROP_BOTTOM + 4} H0 Z`}
                    fill={`url(#${gradId})`}
                    opacity="0.55"
                  />
                </>
              )}
            </g>

            <path
              className="water-widget__drop-shine"
              d="M40 8 C40 8 70 44 70 66 C70 82 57 93 40 93 C23 93 10 82 10 66 C10 44 40 8 40 8 Z"
              fill={`url(#${shineId})`}
            />
          </svg>
        </div>

        <div className="water-widget__body">
          <div className="water-widget__head">
            <h3>{t("water.title")}</h3>
            <span className="water-widget__pct">{Math.round(pct)}%</span>
          </div>
          <p className="water-widget__amount">
            <strong>{ml}</strong>
            <span className="muted">
              {" "}
              / {goal} {t("water.ml")}
            </span>
          </p>
          {!readOnly && (
            <div className="water-widget__actions">
              <button
                type="button"
                className="btn btn-secondary btn-sm water-widget__btn"
                disabled={busy}
                onClick={() => void add(250)}
              >
                +250
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm water-widget__btn"
                disabled={busy}
                onClick={() => void add(500)}
              >
                +500
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
