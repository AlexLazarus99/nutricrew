import { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FitnessBackground } from "./FitnessBackground";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { MeProvider, useMe } from "../hooks/useMe";
import { RegistrationPage } from "../pages/Registration";
import { PostRegistrationOffer } from "../pages/PostRegistrationOffer";
import { useTelegram } from "../hooks/useTelegram";
import { shouldShowPostRegistrationOffer } from "../lib/postRegistration";
import { sectionFromPath, type AppSection } from "../lib/appSection";

function resolveSection(
  registered: boolean,
  showWellnessOffer: boolean,
  pathname: string,
): AppSection {
  if (!registered) return "auth";
  if (showWellnessOffer) return "guide";
  return sectionFromPath(pathname);
}

function LayoutShell() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const { me, refresh } = useMe();
  const { user } = useTelegram();
  const registered = me.profileComplete;
  const [offerDismissed, setOfferDismissed] = useState(false);
  const showWellnessOffer =
    !offerDismissed && shouldShowPostRegistrationOffer(registered);
  const displayName = me.user.firstName ?? user?.first_name;
  const section = resolveSection(registered, showWellnessOffer, pathname);
  const compactNav = registered && !me.teamId;

  return (
    <div className="app-shell" data-section={section}>
      <FitnessBackground />
      <header className="app-header">
        <div>
          <h1>{t("app.name")}</h1>
          <p className="tagline">{t("app.tagline")}</p>
        </div>
        <LanguageSwitcher />
      </header>

      <main className="app-main">
        {!registered ? (
          <RegistrationPage onComplete={refresh} displayName={displayName} />
        ) : showWellnessOffer && !pathname.startsWith("/game") && !pathname.startsWith("/quiz") ? (
          <PostRegistrationOffer
            displayName={displayName}
            onDismiss={() => setOfferDismissed(true)}
          />
        ) : (
          <Outlet />
        )}
      </main>

      {registered &&
        (!showWellnessOffer || pathname.startsWith("/game") || pathname.startsWith("/quiz")) && (
        <nav className={`bottom-nav ${compactNav ? "bottom-nav-5" : "bottom-nav-8"}`}>
          <NavLink to="/" end>
            {t("nav.home")}
          </NavLink>
          <NavLink
            to="/log"
            className={({ isActive }) =>
              isActive || pathname.startsWith("/diary") ? "active" : undefined
            }
          >
            {t("nav.log")}
          </NavLink>
          <NavLink to="/game">{t("nav.game")}</NavLink>
          {compactNav ? (
            <>
              <NavLink to="/quiz">{t("nav.quiz")}</NavLink>
              <NavLink to="/guide">{t("nav.guide")}</NavLink>
            </>
          ) : (
            <>
              <NavLink to="/guide">{t("nav.guide")}</NavLink>
              <NavLink to="/quiz">{t("nav.quiz")}</NavLink>
              <NavLink to="/team">{t("nav.team")}</NavLink>
              <NavLink to="/leaderboard">{t("nav.rank")}</NavLink>
              <NavLink to="/prizes">{t("nav.prizes")}</NavLink>
            </>
          )}
        </nav>
      )}
    </div>
  );
}

export function Layout() {
  return (
    <MeProvider>
      <LayoutShell />
    </MeProvider>
  );
}
