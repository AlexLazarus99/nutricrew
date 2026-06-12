import { FormEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../api/client";
import { loadCalcPrefs, saveCalcPrefs } from "../lib/calorieCalculator";
import { markPostRegistrationOfferPending } from "../lib/postRegistration";

type Props = {
  onComplete: () => Promise<void>;
  displayName?: string;
  /** Shown after 3 guest meal logs — profile required to continue. */
  gateMode?: boolean;
};

export function RegistrationPage({ onComplete, displayName, gateMode }: Props) {
  const { t } = useTranslation();
  const [weightKg, setWeightKg] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [age, setAge] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const weight = Number(weightKg);
      const height = Math.round(Number(heightCm));
      const ageYears = Math.round(Number(age));
      await api.completeProfile(weight, height, ageYears);
      const prev = loadCalcPrefs();
      saveCalcPrefs({
        sex: prev.sex ?? "male",
        age: ageYears,
        weightKg: weight,
        heightCm: height,
        activity: prev.activity ?? "moderate",
        goal: prev.goal ?? "maintain",
      });
      markPostRegistrationOfferPending();
      await onComplete();
    } catch (err) {
      const code = (err as Error).message;
      if (code === "INVALID_WEIGHT") {
        setError(t("registration.invalidWeight"));
      } else if (code === "INVALID_HEIGHT") {
        setError(t("registration.invalidHeight"));
      } else if (code === "INVALID_AGE") {
        setError(t("registration.invalidAge"));
      } else {
        setError(code);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="stack registration-page">
      <div className="card hero">
        <h2>
          {gateMode
            ? t("registration.gateTitle", { name: displayName ?? t("registration.friend") })
            : t("registration.title", { name: displayName ?? t("registration.friend") })}
        </h2>
        <p className="muted">
          {gateMode ? t("registration.gateSubtitle") : t("registration.subtitle")}
        </p>
      </div>

      <form className="card form registration-form" onSubmit={onSubmit}>
        <label>
          {t("registration.weight")}
          <input
            type="number"
            inputMode="decimal"
            min={30}
            max={300}
            step={0.1}
            required
            value={weightKg}
            onChange={(e) => setWeightKg(e.target.value)}
            placeholder="70"
          />
        </label>
        <label>
          {t("registration.height")}
          <input
            type="number"
            inputMode="numeric"
            min={120}
            max={230}
            step={1}
            required
            value={heightCm}
            onChange={(e) => setHeightCm(e.target.value)}
            placeholder="170"
          />
        </label>
        <label>
          {t("registration.age")}
          <input
            type="number"
            inputMode="numeric"
            min={14}
            max={100}
            step={1}
            required
            value={age}
            onChange={(e) => setAge(e.target.value)}
            placeholder="30"
          />
        </label>
        {error && <p className="form-error">{error}</p>}
        <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
          {busy ? t("common.loading") : t("registration.continue")}
        </button>
      </form>

      <p className="muted small registration-note">{t("registration.note")}</p>
    </section>
  );
}
