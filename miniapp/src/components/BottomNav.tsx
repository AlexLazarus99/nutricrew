import { useCallback, useEffect, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

const STORAGE_KEY = "nutricrew_nav_collapsed";

type Props = {
  compactNav: boolean;
  hasTeam: boolean;
};

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
  const touchStartY = useRef<number | null>(null);

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
    touchStartY.current = e.touches[0]?.clientY ?? null;
  }

  function onTouchEnd(e: React.TouchEvent) {
    const start = touchStartY.current;
    touchStartY.current = null;
    if (start == null) return;
    const endY = e.changedTouches[0]?.clientY ?? start;
    const delta = endY - start;
    if (delta > 36) setCollapsed(true);
    if (delta < -36) setCollapsed(false);
  }

  const gridClass = compactNav
    ? "bottom-nav-5"
    : hasTeam
      ? "bottom-nav-9"
      : "bottom-nav-8";

  return (
    <>
      {collapsed && (
        <button
          type="button"
          className="bottom-nav-peek"
          aria-label={t("nav.expandMenu")}
          onClick={toggle}
        >
          <span className="bottom-nav-peek__bar" />
          <span className="bottom-nav-peek__label">{t("nav.menu")}</span>
        </button>
      )}
      <nav
        className={`bottom-nav ${gridClass} ${collapsed ? "bottom-nav--collapsed" : ""}`}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <button
          type="button"
          className="bottom-nav-handle"
          aria-label={collapsed ? t("nav.expandMenu") : t("nav.collapseMenu")}
          onClick={toggle}
        >
          <span className="bottom-nav-handle__bar" />
        </button>
        <NavLink to="/" end>
          {t("nav.home")}
        </NavLink>
        <NavLink
          to="/log"
          data-tutorial="nav-log"
          className={({ isActive }) =>
            isActive || pathname.startsWith("/diary") ? "active" : undefined
          }
        >
          {t("nav.log")}
        </NavLink>
        {compactNav ? (
          <>
            <NavLink to="/quiz">{t("nav.quiz")}</NavLink>
            <NavLink to="/guide">{t("nav.guide")}</NavLink>
            <NavLink to="/game" data-tutorial="nav-game">
              {t("nav.game")}
            </NavLink>
          </>
        ) : (
          <>
            <NavLink to="/guide">{t("nav.guide")}</NavLink>
            <NavLink to="/quiz">{t("nav.quiz")}</NavLink>
            <NavLink to="/team" data-tutorial="nav-team">
              {t("nav.team")}
            </NavLink>
            {hasTeam ? <NavLink to="/chat">{t("nav.chat")}</NavLink> : null}
            <NavLink to="/leaderboard">{t("nav.rank")}</NavLink>
            <NavLink to="/game" data-tutorial="nav-game">
              {t("nav.game")}
            </NavLink>
            <NavLink to="/prizes">{t("nav.prizes")}</NavLink>
          </>
        )}
      </nav>
    </>
  );
}
