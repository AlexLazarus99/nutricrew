import { useTranslation } from "react-i18next";
import { ProActionTile } from "../pro/ProActionTile";
import { ProTributeButton } from "../pro/ProTributeButton";
import { useMe } from "../../hooks/useMe";
import { isProGatedPath } from "../../lib/proGated";
import type { NavBadgeKind } from "../nav/NavBadgeIcon";

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

  function tileVariant(action: Action): "pro" | "channel" | "muted" {
    if (action.primary) return "pro";
    if (action.to === "/coach") return "channel";
    return "muted";
  }

  function renderAction(action: Action, compact?: boolean) {
    const locked = !isPro && isProGatedPath(action.to);

    return (
      <div
        key={action.to}
        className={[
          "home-action-grid__cell",
          compact ? "home-action-grid__cell--compact" : "",
          action.primary ? "home-action-grid__cell--primary" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <ProActionTile
          to={action.to}
          label={label(action)}
          kind={action.kind}
          variant={tileVariant(action)}
          size={action.primary ? "hero" : compact ? "compact" : "default"}
          locked={locked}
        />
        {locked ? (
          <ProTributeButton
            size="pill"
            source={`home-${action.to}`}
            className="home-action-grid__pro-pill"
            variant={action.to === "/coach" ? "channel" : "pro"}
          >
            {t("pro.pill")}
          </ProTributeButton>
        ) : null}
      </div>
    );
  }

  return (
    <>
      <div className="home-action-grid home-action-grid--pro">
        {primary.map((action) => renderAction(action))}
      </div>
      {secondary.length > 0 ? (
        <div className="home-action-grid home-action-grid--secondary home-action-grid--pro">
          {secondary.map((item) => renderAction(item, true))}
        </div>
      ) : null}
    </>
  );
}
