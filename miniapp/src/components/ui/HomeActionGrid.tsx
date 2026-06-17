import { useTranslation } from "react-i18next";
import { ProActionTile, type ProTileTone } from "../pro/ProActionTile";
import { ProTributeButton } from "../pro/ProTributeButton";
import { useMe } from "../../hooks/useMe";
import { isProGatedPath } from "../../lib/proGated";
import type { NavBadgeKind } from "../nav/NavBadgeIcon";

type Action = {
  to: string;
  kind: NavBadgeKind;
  labelKey: string;
  tone: ProTileTone;
  params?: Record<string, string | number>;
};

type Props = {
  showPrizes?: boolean;
  starBalance?: number;
  showTrends?: boolean;
  showPro?: boolean;
};

const TONE_BY_PATH: Record<string, ProTileTone> = {
  "/log": "food",
  "/coach": "coach",
  "/guide": "guide",
  "/quiz": "quiz",
  "/game": "game",
  "/trends": "report",
  "/report": "report",
  "/pro": "pro",
  "/prizes": "prizes",
  "/features": "features",
};

export function HomeActionGrid({ showPrizes, starBalance, showTrends, showPro }: Props) {
  const { t } = useTranslation();
  const { me } = useMe();
  const isPro = !!me.pro?.isPro;

  const primary: Action[] = [
    { to: "/coach", kind: "coach", labelKey: "coach.title", tone: "coach" },
    { to: "/guide", kind: "guide", labelKey: "home.guideCta", tone: "guide" },
    { to: "/quiz", kind: "quiz", labelKey: "home.quizCta", tone: "quiz" },
    { to: "/game", kind: "game", labelKey: "home.gameCta", tone: "game" },
  ];

  const secondary: Action[] = [];
  if (showTrends) {
    secondary.push({ to: "/trends", kind: "report", labelKey: "trends.title", tone: "report" });
  }
  if (showPro) {
    secondary.push({ to: "/pro", kind: "features", labelKey: "pro.title", tone: "pro" });
  }
  if (showPrizes) {
    secondary.push({
      to: "/prizes",
      kind: "prizes",
      labelKey: "nav.prizes",
      tone: "prizes",
      params: { count: starBalance ?? 0 },
    });
  }
  secondary.push({ to: "/features", kind: "features", labelKey: "nav.features", tone: "features" });

  function label(action: Action) {
    if (action.params) {
      return `${t(action.labelKey)} (${action.params.count})`;
    }
    return t(action.labelKey);
  }

  function renderAction(action: Action, compact?: boolean) {
    const locked = !isPro && isProGatedPath(action.to);
    const tone = action.tone ?? TONE_BY_PATH[action.to] ?? "features";

    return (
      <div
        key={action.to}
        className={["home-action-grid__cell", compact ? "home-action-grid__cell--compact" : ""]
          .filter(Boolean)
          .join(" ")}
      >
        <ProActionTile
          to={action.to}
          label={label(action)}
          kind={action.kind}
          tone={tone}
          size={compact ? "compact" : "default"}
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
