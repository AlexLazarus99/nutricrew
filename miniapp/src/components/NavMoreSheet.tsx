import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { NavBadgeIcon, type NavBadgeKind } from "./nav/NavBadgeIcon";
import { ProTributeButton } from "./pro/ProTributeButton";
import { isProGatedPath } from "../lib/proGated";

type MoreItem = {
  to: string;
  kind: NavBadgeKind;
  labelKey: string;
  end?: boolean;
  proGated?: boolean;
};

type Props = {
  open: boolean;
  onClose: () => void;
  hasTeam: boolean;
  isPro: boolean;
};

export function NavMoreSheet({ open, onClose, hasTeam, isPro }: Props) {
  const { t } = useTranslation();

  if (!open) return null;

  const items: MoreItem[] = [];

  if (hasTeam) {
    items.push({ to: "/team", kind: "team", labelKey: "nav.team" });
    items.push({ to: "/chat", kind: "chat", labelKey: "nav.chat" });
    items.push({ to: "/leaderboard", kind: "rank", labelKey: "nav.rank" });
    items.push({ to: "/prizes", kind: "prizes", labelKey: "nav.prizes" });
  }

  items.push(
    { to: "/coach", kind: "coach", labelKey: "nav.coach", proGated: true },
    { to: "/quiz", kind: "quiz", labelKey: "nav.quiz" },
    { to: "/report", kind: "report", labelKey: "nav.report", proGated: true },
    { to: "/trends", kind: "trends", labelKey: "trends.title", proGated: true },
    { to: "/referrals", kind: "referrals", labelKey: "nav.referrals" },
    { to: "/business", kind: "business", labelKey: "nav.business" },
    { to: "/features", kind: "features", labelKey: "nav.features", end: true },
    { to: "/settings", kind: "settings", labelKey: "nav.settings" },
  );

  return (
    <div
      className="nav-more-sheet"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="nav-more-sheet__panel" role="dialog" aria-modal="true" aria-label={t("nav.moreTitle")}>
        <div className="nav-more-sheet__head">
          <h2 className="nav-more-sheet__title">{t("nav.moreTitle")}</h2>
          <button type="button" className="nc-modal__close" onClick={onClose} aria-label={t("common.close")}>
            ×
          </button>
        </div>
        <div className="nav-more-sheet__grid">
          {items.map((item) => {
            const locked = !isPro && item.proGated && isProGatedPath(item.to);

            return (
              <div key={item.to} className="nav-more-sheet__cell">
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    [
                      "nav-more-sheet__item",
                      `nav-more-sheet__item--tone-${item.kind}`,
                      isActive ? "active" : "",
                      locked ? "nav-more-sheet__item--pro-locked" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")
                  }
                  onClick={onClose}
                >
                  {({ isActive }) => (
                    <>
                      <span className="nav-more-sheet__icon-wrap">
                        <NavBadgeIcon kind={item.kind} size={50} active={isActive} animated />
                        {locked ? <span className="nav-more-sheet__lock" aria-hidden>🔒</span> : null}
                      </span>
                      <span className="nav-more-sheet__label">{t(item.labelKey)}</span>
                    </>
                  )}
                </NavLink>
                {locked ? (
                  <ProTributeButton size="pill" source={`more-${item.to}`} className="nav-more-sheet__pro-pill">
                    {t("pro.pill")}
                  </ProTributeButton>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
