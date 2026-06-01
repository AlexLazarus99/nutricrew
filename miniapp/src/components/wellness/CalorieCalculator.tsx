import { FormEvent, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  BMR_FORMULA_IDS,
  DEFAULT_BMR_FORMULA,
  type ActivityLevel,
  type BmrFormulaId,
  type CalorieGoal,
  type CalorieInput,
  type Sex,
  calcCalories,
  loadCalcPrefs,
  saveCalcPrefs,
  validateInput,
} from "../../lib/calorieCalculator";

const ACTIVITY_LEVELS: ActivityLevel[] = ["sedentary", "light", "moderate", "active", "veryActive"];
const GOALS: CalorieGoal[] = [
  "maintain",
  "loseSlow",
  "loseModerate",
  "loseFast",
  "gainSlow",
  "gainModerate",
];

function buildInput(
  sex: Sex,
  age: string,
  weightKg: string,
  heightCm: string,
  activity: ActivityLevel,
  goal: CalorieGoal,
  bmrFormula: BmrFormulaId,
): CalorieInput {
  return {
    sex,
    age: Number(age),
    weightKg: Number(weightKg),
    heightCm: Number(heightCm),
    activity,
    goal,
    bmrFormula,
  };
}

export function CalorieCalculator() {
  const { t } = useTranslation();
  const saved = loadCalcPrefs();

  const [sex, setSex] = useState<Sex>(saved.sex ?? "female");
  const [age, setAge] = useState(String(saved.age ?? 30));
  const [weightKg, setWeightKg] = useState(String(saved.weightKg ?? 70));
  const [heightCm, setHeightCm] = useState(String(saved.heightCm ?? 170));
  const [activity, setActivity] = useState<ActivityLevel>(saved.activity ?? "moderate");
  const [goal, setGoal] = useState<CalorieGoal>(saved.goal ?? "loseModerate");
  const [bmrFormula, setBmrFormula] = useState<BmrFormulaId>(saved.bmrFormula ?? DEFAULT_BMR_FORMULA);
  const [submitted, setSubmitted] = useState<CalorieInput | null>(() => {
    const input = buildInput(
      saved.sex ?? "female",
      String(saved.age ?? 30),
      String(saved.weightKg ?? 70),
      String(saved.heightCm ?? 170),
      saved.activity ?? "moderate",
      saved.goal ?? "loseModerate",
      saved.bmrFormula ?? DEFAULT_BMR_FORMULA,
    );
    return validateInput(input) ? null : input;
  });

  const result = useMemo(() => (submitted ? calcCalories(submitted) : null), [submitted]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const input = buildInput(sex, age, weightKg, heightCm, activity, goal, bmrFormula);
    if (validateInput(input)) return;
    saveCalcPrefs(input);
    setSubmitted(input);
  }

  return (
    <div className="calorie-calc">
      <form className="card form calorie-form" onSubmit={onSubmit}>
        <h3>{t("calculator.formTitle")}</h3>
        <p className="muted small">{t("calculator.formHint")}</p>

        <fieldset className="calorie-sex">
          <legend>{t("calculator.sex")}</legend>
          <div className="calorie-sex-btns">
            {(["female", "male"] as Sex[]).map((s) => (
              <button
                key={s}
                type="button"
                className={sex === s ? "active" : ""}
                onClick={() => setSex(s)}
              >
                {t(`calculator.sexOptions.${s}`)}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="calorie-row">
          <label>
            {t("calculator.age")}
            <input
              type="number"
              min={14}
              max={100}
              value={age}
              onChange={(e) => setAge(e.target.value)}
              required
            />
          </label>
          <label>
            {t("calculator.weight")}
            <input
              type="number"
              min={30}
              max={300}
              step={0.1}
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              required
            />
          </label>
        </div>

        <label>
          {t("calculator.height")}
          <input
            type="number"
            min={120}
            max={230}
            value={heightCm}
            onChange={(e) => setHeightCm(e.target.value)}
            required
          />
        </label>

        <label>
          {t("calculator.activity")}
          <select value={activity} onChange={(e) => setActivity(e.target.value as ActivityLevel)}>
            {ACTIVITY_LEVELS.map((level) => (
              <option key={level} value={level}>
                {t(`calculator.activityLevels.${level}.label`)} —{" "}
                {t(`calculator.activityLevels.${level}.desc`)}
              </option>
            ))}
          </select>
        </label>

        <fieldset className="calorie-formulas">
          <legend>{t("calculator.primaryFormula")}</legend>
          <p className="muted small">{t("calculator.primaryFormulaHint")}</p>
          <div className="calorie-formula-list">
            {BMR_FORMULA_IDS.map((id) => (
              <button
                key={id}
                type="button"
                className={`calorie-formula-btn ${bmrFormula === id ? "active" : ""}`}
                onClick={() => setBmrFormula(id)}
              >
                <span className="calorie-formula-name">{t(`calculator.formulas.${id}.name`)}</span>
                <span className="calorie-formula-desc">{t(`calculator.formulas.${id}.desc`)}</span>
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="calorie-goals">
          <legend>{t("calculator.goal")}</legend>
          <div className="calorie-goal-grid">
            {GOALS.map((g) => (
              <button
                key={g}
                type="button"
                className={`calorie-goal-btn ${goal === g ? "active" : ""} ${g.startsWith("lose") ? "lose" : g.startsWith("gain") ? "gain" : ""}`}
                onClick={() => setGoal(g)}
              >
                <span className="calorie-goal-name">{t(`calculator.goals.${g}.label`)}</span>
                <span className="calorie-goal-delta">{t(`calculator.goals.${g}.delta`)}</span>
              </button>
            ))}
          </div>
        </fieldset>

        <button type="submit" className="btn btn-primary btn-block">
          {t("calculator.calculate")}
        </button>
      </form>

      {result && submitted && (
        <div className="calorie-results stack">
          {result.belowSafeMinimum && (
            <div className="card calorie-warn">
              <p>{t("calculator.safeMinimumWarning", { min: result.safeMinimum })}</p>
            </div>
          )}

          <div className="card calorie-result-main">
            <p className="muted small">
              {t("calculator.dailyTarget")} · {t(`calculator.formulas.${result.formula}.name`)}
            </p>
            <p className="calorie-big">{result.target}</p>
            <p className="calorie-unit">{t("calculator.kcalPerDay")}</p>
            {result.weeklyKgChange !== 0 && (
              <p className="calorie-weekly">
                {t("calculator.weeklyChange", {
                  kg: Math.abs(result.weeklyKgChange),
                  direction: t(
                    result.weeklyKgChange < 0 ? "calculator.directionLoss" : "calculator.directionGain",
                  ),
                })}
              </p>
            )}
          </div>

          <div className="stats-row calorie-stats">
            <div className="stat">
              <span className="stat-value">{result.bmr}</span>
              <span className="stat-label">{t("calculator.bmr")}</span>
            </div>
            <div className="stat">
              <span className="stat-value">{result.tdee}</span>
              <span className="stat-label">{t("calculator.tdee")}</span>
            </div>
          </div>

          <div className="card">
            <h3>{t("calculator.compareTitle")}</h3>
            <p className="muted small">{t("calculator.compareHint")}</p>
            <div className="calorie-formula-table-wrap">
              <table className="calorie-formula-table">
                <thead>
                  <tr>
                    <th>{t("calculator.compareFormula")}</th>
                    <th>{t("calculator.bmr")}</th>
                    <th>{t("calculator.tdee")}</th>
                    <th>{t("calculator.compareTarget")}</th>
                  </tr>
                </thead>
                <tbody>
                  {result.allFormulas.map((row) => (
                    <tr key={row.id} className={row.id === result.formula ? "calorie-formula-row-active" : ""}>
                      <td>
                        <strong>{t(`calculator.formulas.${row.id}.name`)}</strong>
                        {row.id === result.formula && (
                          <span className="calorie-formula-badge">{t("calculator.primaryBadge")}</span>
                        )}
                      </td>
                      <td>{row.bmr}</td>
                      <td>{row.tdee}</td>
                      <td>{row.target}</td>
                    </tr>
                  ))}
                  <tr className="calorie-formula-row-avg">
                    <td>
                      <strong>{t("calculator.averageRow")}</strong>
                    </td>
                    <td>{result.averageBmr}</td>
                    <td>{result.averageTdee}</td>
                    <td>—</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="card">
            <h3>{t("calculator.macrosTitle")}</h3>
            <p className="muted small">{t("calculator.macrosHint")}</p>
            <div className="calorie-macro-bar">
              <span style={{ width: `${result.macros.proteinPct}%` }} className="macro-protein" title="Protein" />
              <span style={{ width: `${result.macros.carbsPct}%` }} className="macro-carbs" title="Carbs" />
              <span style={{ width: `${result.macros.fatPct}%` }} className="macro-fat" title="Fat" />
            </div>
            <ul className="calorie-macro-list">
              <li>
                <span className="macro-dot macro-protein" />
                {t("calculator.protein")}: <strong>{result.macros.proteinG} g</strong> ({result.macros.proteinPct}%)
              </li>
              <li>
                <span className="macro-dot macro-carbs" />
                {t("calculator.carbs")}: <strong>{result.macros.carbsG} g</strong> ({result.macros.carbsPct}%)
              </li>
              <li>
                <span className="macro-dot macro-fat" />
                {t("calculator.fat")}: <strong>{result.macros.fatG} g</strong> ({result.macros.fatPct}%)
              </li>
            </ul>
          </div>

          <div className="card wellness-disclaimer">
            <p className="small muted">{t("calculator.formulaNote")}</p>
            <p className="small muted">{t("calculator.disclaimer")}</p>
          </div>
        </div>
      )}
    </div>
  );
}
