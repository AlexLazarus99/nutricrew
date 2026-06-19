import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api, type TrendsResponse } from "../api/client";
import { useMe } from "../hooks/useMe";
import { ProGate } from "../components/pro/ProGate";
import { DeficitChart } from "../components/pro/DeficitChart";
import { ProTributeButton } from "../components/pro/ProTributeButton";

function MiniBarChart({
  data,
  field,
  max,
  color,
}: {
  data: TrendsResponse["daily"];
  field: "calories" | "protein";
  max: number;
  color: string;
}) {
  const top = max || 1;
  return (
    <div className="trends-chart" aria-hidden>
      {data.map((d) => {
        const h = Math.max(4, Math.round((d[field] / top) * 100));
        return (
          <div key={d.date} className="trends-chart__col" title={`${d.date}: ${d[field]}`}>
            <div className="trends-chart__bar" style={{ height: `${h}%`, background: color }} />
          </div>
        );
      })}
    </div>
  );
}

function TrendsContent() {
  const { t } = useTranslation();
  const { me } = useMe();
  const isPro = !!me.pro?.isPro;
  const [range, setRange] = useState<"7d" | "30d" | "90d">(isPro ? "30d" : "7d");
  const [data, setData] = useState<TrendsResponse | null>(null);
  const [deficit, setDeficit] = useState<Awaited<ReturnType<typeof api.getProDeficit>> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    api
      .getTrends(range)
      .then(setData)
      .catch((e: Error) => setError(e.message));
  }, [range]);

  useEffect(() => {
    if (!isPro) return;
    void api.getProDeficit(range).then(setDeficit).catch(() => setDeficit(null));
  }, [range, isPro]);

  const maxKcal = data ? Math.max(data.kcalTarget ?? 0, ...data.daily.map((d) => d.calories), 1) : 1;
  const maxProtein = data
    ? Math.max(data.proteinTarget ?? 0, ...data.daily.map((d) => d.protein), 1)
    : 1;

  function selectRange(r: "7d" | "30d" | "90d") {
    if (!isPro && r !== "7d") return;
    setRange(r);
  }

  return (
    <section className="stack">
      <div className="card hero">
        <h2>{t("trends.title")}</h2>
        <p className="muted">{t("trends.subtitle")}</p>
        <div className="trends-range-tabs">
          {(["7d", "30d", "90d"] as const).map((r) => {
            const locked = !isPro && r !== "7d";
            return (
              <button
                key={r}
                type="button"
                className={`btn btn-sm ${range === r ? "btn-primary" : "btn-secondary"}${locked ? " trends-range-tabs__locked" : ""}`}
                onClick={() => selectRange(r)}
              >
                {locked ? "🔒 " : ""}
                {t(`trends.range.${r}`)}
              </button>
            );
          })}
        </div>
        {!isPro && (
          <p className="muted small trends-pro-hint">
            {t("pro.trendsLiteHint")}{" "}
            <ProTributeButton size="pill" source="trends-range">
              {t("pro.pill")}
            </ProTributeButton>
          </p>
        )}
      </div>

      {error && <p className="error">{error}</p>}
      {!data && !error && <p className="loading">{t("common.loading")}</p>}

      {data && (
        <>
          {deficit && (
            <div className="card pro-deficit-card pro-animate-in">
              <h3>{t("pro.deficitTitle")}</h3>
              <p className="muted small">
                {t("pro.deficitAvg", { kcal: deficit.avgBalance, kg: deficit.projectedKgPerWeek })}
              </p>
              <DeficitChart daily={deficit.daily} />
            </div>
          )}

          <div className="card">
            <h3>{t("trends.calories")}</h3>
            <p className="muted small">
              {t("trends.avg")}: {data.avgCalories}
              {data.kcalTarget ? ` · ${t("trends.target")}: ${data.kcalTarget}` : ""}
            </p>
            <MiniBarChart data={data.daily} field="calories" max={maxKcal} color="#7ec4a0" />
          </div>

          <div className="card">
            <h3>{t("trends.protein")}</h3>
            <p className="muted small">
              {t("trends.avg")}: {data.avgProtein} g
              {data.proteinTarget ? ` · ${t("trends.target")}: ${data.proteinTarget} g` : ""}
            </p>
            <MiniBarChart data={data.daily} field="protein" max={maxProtein} color="#64b5f6" />
          </div>

          {data.insightTexts.length > 0 && (
            <div className="card">
              <h3>{t("trends.insights")}</h3>
              <ul className="trends-insights">
                {data.insightTexts.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
          )}

          {data.weightLogs.length > 0 && (
            <div className="card">
              <h3>{t("trends.weight")}</h3>
              <ul className="weight-log-list">
                {data.weightLogs.slice(-8).map((w) => (
                  <li key={w.id}>
                    <strong>{w.kg} kg</strong>
                    <span className="muted small">
                      {new Date(w.loggedAt).toLocaleDateString()}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      <Link to="/" className="btn btn-secondary btn-block">
        {t("common.backHome")}
      </Link>
    </section>
  );
}

export function TrendsPage() {
  return (
    <ProGate titleKey="trends.title" descKey="pro.featureReports" source="gate-trends">
      <TrendsContent />
    </ProGate>
  );
}
