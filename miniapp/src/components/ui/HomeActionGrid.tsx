import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { NavBadgeIcon, type NavBadgeKind } from "../nav/NavBadgeIcon";

type Action = {
  to: string;
  kind: NavBadgeKind;
  labelKey: string;
  primary?: boolean;
};

type Props = {
  showPrizes?: boolean;
  starBalance?: number;
  showTrends?: boolean;
  showPro?: boolean;
};

export function HomeActionGrid({ showPrizes, starBalance, showTrends, showPro }: Props) {
  const { t } = useTranslation();

  const primary: Action[] = [
    { to: "/log", kind: "food", labelKey: "home.logCta", primary: true },
    { to: "/guide", kind: "guide", labelKey: "home.guideCta" },
    { to: "/quiz", kind: "quiz", labelKey: "home.quizCta" },
    { to: "/game", kind: "game", labelKey: "home.gameCta" },
  ];

  const secondary: { to: string; labelKey: string; params?: Record<string, string | number> }[] = [];
  if (showTrends) secondary.push({ to: "/trends", labelKey: "trends.title" });
  if (showPro) secondary.push({ to: "/pro", labelKey: "pro.title" });
  if (showPrizes) {
    secondary.push({
      to: "/prizes",
      labelKey: "nav.prizes",
      params: { count: starBalance ?? 0 },
    });
  }
  secondary.push({ to: "/features", labelKey: "nav.features" });

  return (
    <>
      <div className="home-action-grid">
        {primary.map((action) => (
          <Link
            key={action.to}
            to={action.to}
            className={`home-action-grid__item${action.primary ? " home-action-grid__item--primary" : ""}`}
          >
            <NavBadgeIcon kind={action.kind} size={40} />
            <span className="home-action-grid__label">{t(action.labelKey)}</span>
          </Link>
        ))}
      </div>
      {secondary.length > 0 ? (
        <div className="home-action-links">
          {secondary.map((item) => (
            <Link key={item.to} to={item.to} className="btn btn-ghost btn-sm">
              {item.params
                ? `${t(item.labelKey)} (${item.params.count})`
                : t(item.labelKey)}
            </Link>
          ))}
        </div>
      ) : null}
    </>
  );
}
