import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../../api/client";

export function WaterWidget() {
  const { t } = useTranslation();
  const [ml, setMl] = useState(0);
  const [goal, setGoal] = useState(2000);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.getWater();
      setMl(res.ml);
      setGoal(res.goalMl);
    } catch {
      /* offline */
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function add(amount: number) {
    setBusy(true);
    try {
      const res = await api.addWater(amount);
      setMl(res.ml);
      setGoal(res.goalMl);
    } finally {
      setBusy(false);
    }
  }

  const pct = Math.min(100, Math.round((ml / goal) * 100));

  return (
    <div className="card water-widget">
      <div className="water-widget__head">
        <h3>{t("wellness.waterTitle")}</h3>
        <span className="muted small">
          {ml} / {goal} {t("wellness.waterMl")}
        </span>
      </div>
      <div className="diary-progress water-widget__bar">
        <div className="diary-progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="water-widget__actions">
        <button type="button" className="btn btn-secondary btn-sm" disabled={busy} onClick={() => void add(250)}>
          +250
        </button>
        <button type="button" className="btn btn-secondary btn-sm" disabled={busy} onClick={() => void add(500)}>
          +500
        </button>
      </div>
    </div>
  );
}
