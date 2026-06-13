import { useCallback, useEffect, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { NavBadgeIcon, type NavBadgeKind } from "./nav/NavBadgeIcon";

const STORAGE_KEY = "nutricrew_nav_collapsed";
const BADGE_SIZE = 46;

type Props = {
  compactNav: boolean;
  hasTeam: boolean;
};

function NavItem({
  to,
  end,
  kind,
  label,
  className,
  isActiveFn,
  tutorial,
}: {
  to: string;
  end?: boolean;
  kind: NavBadgeKind;
  label: string;
  className?: string;
  isActiveFn?: (args: { isActive: boolean; pathname: string }) => boolean;
  tutorial?: string;
}) {
  const { pathname } = useLocation();

  return (
    <NavLink
      to={to}
      end={end}
      data-tutorial={tutorial}
      className={({ isActive }) => {
        const active = isActiveFn ? isActiveFn({ isActive, pathname }) : isActive;
        return ["side-nav__item", active ? "active" : undefined, className]
          .filter(Boolean)
          .join(" ");
      }}
    >
      {({ isActive }) => {
        const active = isActiveFn ? isActiveFn({ isActive, pathname }) : isActive;
        return (
          <>
            <NavBadgeIcon kind={kind} active={active} size={BADGE_SIZE} />
            <span className="side-nav__label">{label}</span>
          </>
        );
      }}
    </NavLink>
  );
}

export function BottomNav({ compactNav, hasTeam }: Props) {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      return false;
    }
  });
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, collapsed ? "1" : "0");
    } catch {
      /* private mode */
    }
    document.documentElement.dataset.navCollapsed = collapsed ? "1" : "0";
  }, [collapsed]);

  const toggle = useCallback(() => {
    setCollapsed((v) => !v);
  }, []);

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  }

  function onTouchEnd(e: React.TouchEvent) {
    const start = touchStartX.current;
    touchStartX.current = null;
    if (start == null) return;
    const endX = e.changedTouches[0]?.clientX ?? start;
    const delta = endX - start;
    if (delta < -36) setCollapsed(true);
    if (delta > 36) setCollapsed(false);
  }

  const foodActive = ({ isActive }: { isActive: boolean }) =>
    isActive || pathname.startsWith("/diary");

  return (
    <>
      {collapsed && (
        <button
          type="button"
          className="side-nav-peek"
          aria-label={t("nav.expandMenu")}
          onClick={toggle}
        >
          <span className="side-nav-peek__bar" />
          <span className="side-nav-peek__label">{t("nav.menu")}</span>
        </button>
      )}
      <nav
        className={`side-nav ${collapsed ? "side-nav--collapsed" : ""}`}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        aria-label={t("nav.menu")}
      >
        <button
          type="button"
          className="side-nav-handle"
          aria-label={collapsed ? t("nav.expandMenu") : t("nav.collapseMenu")}
          onClick={toggle}
        >
          <span className="side-nav-handle__bar" />
        </button>
        <div className="side-nav__scroll">
          <NavItem to="/" end kind="home" label={t("nav.home")} />
          <NavItem to="/log" kind="food" label={t("nav.log")} isActiveFn={foodActive} tutorial="nav-log" />
          {compactNav ? (
            <>
              <NavItem to="/quiz" kind="quiz" label={t("nav.quiz")} />
              <NavItem to="/guide" kind="guide" label={t("nav.guide")} />
              <NavItem to="/report" kind="report" label={t("nav.report")} />
              <NavItem to="/game" kind="game" label={t("nav.game")} tutorial="nav-game" />
            </>
          ) : (
            <>
              <NavItem to="/guide" kind="guide" label={t("nav.guide")} />
              <NavItem to="/quiz" kind="quiz" label={t("nav.quiz")} />
              <NavItem to="/team" kind="team" label={t("nav.team")} tutorial="nav-team" />
              {hasTeam ? <NavItem to="/chat" kind="chat" label={t("nav.chat")} /> : null}
              <NavItem to="/leaderboard" kind="rank" label={t("nav.rank")} />
              <NavItem to="/game" kind="game" label={t("nav.game")} tutorial="nav-game" />
              <NavItem to="/report" kind="report" label={t("nav.report")} />
              <NavItem to="/prizes" kind="prizes" label={t("nav.prizes")} />
            </>
          )}
        </div>
      </nav>
    </>
  );
}
