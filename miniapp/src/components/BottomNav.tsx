import { useCallback, useEffect, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { NavBadgeIcon } from "./nav/NavBadgeIcon";
import { NavMoreSheet } from "./NavMoreSheet";

const STORAGE_KEY = "nutricrew_nav_collapsed";
const BADGE_SIZE = 46;

const MORE_PATHS = ["/quiz", "/report", "/features", "/settings", "/team", "/chat", "/leaderboard", "/prizes", "/trends", "/pro"];

type Props = {
  hasTeam: boolean;
};

function NavItem({
  to,
  end,
  kind,
  label,
  isActiveFn,
  tutorial,
}: {
  to: string;
  end?: boolean;
  kind: Parameters<typeof NavBadgeIcon>[0]["kind"];
  label: string;
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
        return ["bottom-nav__item", active ? "active" : undefined].filter(Boolean).join(" ");
      }}
    >
      {({ isActive }) => {
        const active = isActiveFn ? isActiveFn({ isActive, pathname }) : isActive;
        return (
          <>
            <NavBadgeIcon kind={kind} active={active} size={BADGE_SIZE} />
            <span className="bottom-nav__label">{label}</span>
          </>
        );
      }}
    </NavLink>
  );
}

export function BottomNav({ hasTeam }: Props) {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [moreOpen, setMoreOpen] = useState(false);
  const touchStartY = useRef<number | null>(null);

  const moreActive = MORE_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, collapsed ? "1" : "0");
    } catch {
      /* private mode */
    }
    document.documentElement.dataset.navCollapsed = collapsed ? "1" : "0";
  }, [collapsed]);

  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

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

  const foodActive = ({ isActive }: { isActive: boolean }) =>
    isActive || pathname.startsWith("/diary");

  return (
    <>
      <NavMoreSheet
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
        hasTeam={hasTeam}
      />
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
        className={`bottom-nav bottom-nav-5 ${collapsed ? "bottom-nav--collapsed" : ""}`}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        aria-label={t("nav.menu")}
      >
        <button
          type="button"
          className="bottom-nav-handle"
          aria-label={collapsed ? t("nav.expandMenu") : t("nav.collapseMenu")}
          onClick={toggle}
        >
          <span className="bottom-nav-handle__bar" />
        </button>
        <NavItem to="/" end kind="home" label={t("nav.home")} />
        <NavItem to="/log" kind="food" label={t("nav.log")} isActiveFn={foodActive} tutorial="nav-log" />
        <NavItem to="/guide" kind="guide" label={t("nav.guide")} />
        <NavItem to="/game" kind="game" label={t("nav.game")} tutorial="nav-game" />
        <button
          type="button"
          className={`bottom-nav__item bottom-nav__item--more${moreActive ? " active" : ""}`}
          aria-label={t("nav.more")}
          aria-expanded={moreOpen}
          onClick={() => setMoreOpen((v) => !v)}
        >
          <NavBadgeIcon kind="more" active={moreActive || moreOpen} size={BADGE_SIZE} />
          <span className="bottom-nav__label">{t("nav.more")}</span>
        </button>
      </nav>
    </>
  );
}
