import { useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../../api/client";

export function PlateReviewPanel() {
  const { t } = useTranslation();
  const [description, setDescription] = useState("");
  const [tips, setTips] = useState<string[]>([]);
  const [summary, setSummary] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function analyze() {
    const text = description.trim();
    if (!text || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await api.proPlateReview(text);
      setSummary(res.summary);
      setTips(res.tips);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card plate-review pro-feature-card--plate">
      <h3>{t("pro.plateReviewTitle")}</h3>
      <p className="muted small">{t("pro.plateReviewHint")}</p>
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder={t("pro.plateReviewPlaceholder")}
        rows={2}
        maxLength={500}
      />
      <button type="button" className="btn btn-secondary btn-block" disabled={busy} onClick={() => void analyze()}>
        {busy ? t("common.loading") : t("pro.plateReviewBtn")}
      </button>
      {summary && <p className="plate-review__summary">{summary}</p>}
      {tips.length > 0 && (
        <ul className="plate-review__tips">
          {tips.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      )}
      {error && <p className="error">{error}</p>}
    </div>
  );
}
