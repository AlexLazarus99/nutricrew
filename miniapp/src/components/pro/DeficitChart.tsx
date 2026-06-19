import { useTranslation } from "react-i18next";

type Day = { date: string; calories: number; target: number; balance: number | null };

export function DeficitChart({ daily }: { daily: Day[] }) {
  const { t } = useTranslation();
  const logged = daily.filter((d) => d.balance != null);
  const maxAbs = Math.max(400, ...logged.map((d) => Math.abs(d.balance ?? 0)), 1);

  return (
    <div className="deficit-chart" role="img" aria-label={t("pro.deficitChartAria")}>
      {daily.map((d) => {
        const b = d.balance ?? 0;
        const h = d.balance == null ? 4 : Math.max(8, Math.round((Math.abs(b) / maxAbs) * 100));
        const surplus = b > 0;
        return (
          <div key={d.date} className="deficit-chart__col" title={`${d.date}: ${b > 0 ? "+" : ""}${b}`}>
            <div
              className={`deficit-chart__bar${surplus ? " deficit-chart__bar--surplus" : " deficit-chart__bar--deficit"}`}
              style={{ height: `${h}%`, opacity: d.balance == null ? 0.25 : 1 }}
            />
          </div>
        );
      })}
    </div>
  );
}
