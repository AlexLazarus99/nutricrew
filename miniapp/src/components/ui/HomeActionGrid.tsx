import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { NavBadgeIcon, type NavBadgeKind } from "../nav/NavBadgeIcon";

type Action = {
  to: string;
  kind: NavBadgeKind;
  labelKey: string;
  primary?: boolean;
  params?: Record<string, string | number>;
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

  const secondary: Action[] = [];
  if (showTrends) secondary.push({ to: "/trends", kind: "report", labelKey: "trends.title" });
  if (showPro) secondary.push({ to: "/pro", kind: "features", labelKey: "pro.title" });
  if (showPrizes) {
    secondary.push({
      to: "/prizes",
      kind: "prizes",
      labelKey: "nav.prizes",
      params: { count: starBalance ?? 0 },
    });
  }
  secondary.push({ to: "/features", kind: "features", labelKey: "nav.features" });

  function label(action: Action) {
    if (action.params) {
      return `${t(action.labelKey)} (${action.params.count})`;
    }
    return t(action.labelKey);
  }

  return (
    <>
      <div className="home-action-grid">
        {primary.map((action) => (
          <Link
            key={action.to}
            to={action.to}
            className={`home-action-grid__item${action.primary ? " home-action-grid__item--primary" : ""}`}
          >
            <NavBadgeIcon kind={action.kind} size={40} animated />
            <span className="home-action-grid__label">{label(action)}</span>
          </Link>
        ))}
      </div>
      {secondary.length > 0 ? (
        <div className="home-action-grid home-action-grid--secondary">
          {secondary.map((item) => (
            <Link key={item.to} to={item.to} className="home-action-grid__item home-action-grid__item--compact">
              <NavBadgeIcon kind={item.kind} size={36} animated />
              <span className="home-action-grid__label">{label(item)}</span>
            </Link>
          ))}
        </div>
      ) : null}
    </>
  );
}
