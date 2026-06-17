import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { NavBadgeIcon, type NavBadgeKind } from "../nav/NavBadgeIcon";
import { ProTributeButton } from "../pro/ProTributeButton";
import { useMe } from "../../hooks/useMe";
import { isProGatedPath } from "../../lib/proGated";

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
  const { me } = useMe();
  const isPro = !!me.pro?.isPro;

  const primary: Action[] = [
    { to: "/log", kind: "food", labelKey: "home.logCta", primary: true },
    { to: "/coach", kind: "coach", labelKey: "coach.title" },
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

  function renderAction(action: Action, compact?: boolean) {
    const locked = !isPro && isProGatedPath(action.to);

    return (
      <div
        key={action.to}
        className={`home-action-grid__cell${compact ? " home-action-grid__cell--compact" : ""}`}
      >
        <Link
          to={action.to}
          className={[
            "home-action-grid__item",
            action.primary ? "home-action-grid__item--primary" : "",
            compact ? "home-action-grid__item--compact" : "",
            locked ? "home-action-grid__item--pro-locked" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <span className="home-action-grid__icon-wrap">
            <NavBadgeIcon kind={action.kind} size={compact ? 36 : 40} animated />
            {locked ? <span className="home-action-grid__lock" aria-hidden>🔒</span> : null}
          </span>
          <span className="home-action-grid__label">{label(action)}</span>
        </Link>
        {locked ? (
          <ProTributeButton size="pill" source={`home-${action.to}`} className="home-action-grid__pro-pill">
            {t("pro.pill")}
          </ProTributeButton>
        ) : null}
      </div>
    );
  }

  return (
    <>
      <div className="home-action-grid">
        {primary.map((action) => renderAction(action))}
      </div>
      {secondary.length > 0 ? (
        <div className="home-action-grid home-action-grid--secondary">
          {secondary.map((item) => renderAction(item, true))}
        </div>
      ) : null}
    </>
  );
}
