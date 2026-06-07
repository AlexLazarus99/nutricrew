import { Suspense, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { WellnessBackground } from "./WellnessBackground";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { PageLoader } from "./PageLoader";
import { MeProvider, useMe } from "../hooks/useMe";
import { RegistrationPage } from "../pages/Registration";
import { PostRegistrationOffer } from "../pages/PostRegistrationOffer";
import { useTelegram } from "../hooks/useTelegram";
import { shouldShowPostRegistrationOffer } from "../lib/postRegistration";
import { sectionFromPath, type AppSection } from "../lib/appSection";
import { APP_BUILD } from "../lib/apiBase";
import { SocialLinks } from "./SocialLinks";
import { BrandPeachIcon } from "./BrandPeachIcon";

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
  const { user, colorScheme } = useTelegram();
  const registered = me.profileComplete;
  const [offerDismissed, setOfferDismissed] = useState(false);
  const showWellnessOffer =
    !offerDismissed && shouldShowPostRegistrationOffer(registered);
  const displayName = me.user.firstName ?? user?.first_name;
  const section = resolveSection(registered, showWellnessOffer, pathname);
  const compactNav = registered && !me.teamId;

  return (
    <div className="app-shell" data-section={section} data-color-scheme={colorScheme}>
      <WellnessBackground />
      <header className="app-header">
        <div>
          <h1 className="app-title">
            <span className="app-title__text">{t("app.name")}</span>
            <BrandPeachIcon size={36} className="app-title__peach" animated />
          </h1>
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
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        )}
      </main>

      {registered && !showWellnessOffer && (
        <footer className="app-footer">
          <SocialLinks links={me.socialLinks ?? {}} variant="footer" />
          <nav className="footer-legal">
            <NavLink to="/report">{t("nav.report")}</NavLink>
            <NavLink to="/settings">{t("nav.settings")}</NavLink>
            <NavLink to="/privacy">{t("nav.privacy")}</NavLink>
          </nav>
          <p className="muted build-stamp">build {APP_BUILD}</p>
        </footer>
      )}

      {registered &&
        (!showWellnessOffer || pathname.startsWith("/game") || pathname.startsWith("/quiz")) && (
        <nav
          className={`bottom-nav ${
            compactNav ? "bottom-nav-5" : me.teamId ? "bottom-nav-9" : "bottom-nav-8"
          }`}
        >
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
              {me.teamId ? <NavLink to="/chat">{t("nav.chat")}</NavLink> : null}
              <NavLink to="/leaderboard">{t("nav.rank")}</NavLink>
              <NavLink to="/game" data-tutorial="nav-game">
                {t("nav.game")}
              </NavLink>
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
