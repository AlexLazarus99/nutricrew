import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../../api/client";

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("READ_FAILED"));
        return;
      }
      const base64 = result.includes(",") ? result.split(",")[1]! : result;
      resolve(base64);
    };
    reader.onerror = () => reject(reader.error ?? new Error("READ_FAILED"));
    reader.readAsDataURL(file);
  });
}

export function PlateReviewPanel() {
  const { t } = useTranslation();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [description, setDescription] = useState("");
  const [photoName, setPhotoName] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | undefined>();
  const [tips, setTips] = useState<string[]>([]);
  const [summary, setSummary] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onPhotoPick(file: File | null) {
    if (!file) {
      setPhotoName(null);
      setImageBase64(undefined);
      return;
    }
    setPhotoName(file.name);
    try {
      setImageBase64(await readFileAsBase64(file));
    } catch {
      setPhotoName(null);
      setImageBase64(undefined);
      setError(t("pro.plateReviewPhotoError"));
    }
  }

  async function analyze() {
    const text = description.trim();
    if ((!text && !imageBase64) || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await api.proPlateReview(text, imageBase64);
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
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => void onPhotoPick(e.target.files?.[0] ?? null)}
      />
      <button
        type="button"
        className="btn btn-secondary btn-block"
        onClick={() => fileRef.current?.click()}
      >
        {photoName ? t("pro.plateReviewPhotoSelected", { name: photoName }) : t("pro.plateReviewPhoto")}
      </button>
      <button
        type="button"
        className="btn btn-secondary btn-block"
        disabled={busy || (!description.trim() && !imageBase64)}
        onClick={() => void analyze()}
      >
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
