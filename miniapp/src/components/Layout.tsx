import { Suspense, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { WellnessBackground } from "./WellnessBackground";
import { PageLoader } from "./PageLoader";
import { MeProvider, useMe } from "../hooks/useMe";
import { AppPreferencesProvider, useAppPreferences } from "../hooks/useAppPreferences";
import { RegistrationPage } from "../pages/Registration";
import { PostRegistrationOffer } from "../pages/PostRegistrationOffer";
import { useTelegram } from "../hooks/useTelegram";
import { shouldShowPostRegistrationOffer } from "../lib/postRegistration";
import { sectionFromPath, type AppSection } from "../lib/appSection";
import { APP_BUILD } from "../lib/apiBase";
import { SocialLinks } from "./SocialLinks";
import { BrandPeachIcon } from "./BrandPeachIcon";
import { BottomNav } from "./BottomNav";
import { AppHeaderActions } from "./AppHeaderActions";

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
  const { prefs } = useAppPreferences();
  const { user, colorScheme } = useTelegram();
  const registered = me.profileComplete;
  const [offerDismissed, setOfferDismissed] = useState(false);
  const showWellnessOffer =
    !offerDismissed && shouldShowPostRegistrationOffer(registered);
  const displayName = me.user.firstName ?? user?.first_name;
  const section = resolveSection(registered, showWellnessOffer, pathname);
  const compactNav = registered && !me.teamId;

  return (
    <div
      className="app-shell"
      data-section={section}
      data-color-scheme={colorScheme}
      data-font-scale={prefs.fontSize}
      data-reduce-motion={prefs.reduceMotion ? "true" : undefined}
    >
      <WellnessBackground />
      <header className="app-header">
        <div className="app-header__brand">
          <h1 className="app-title">
            <span className="app-title__text">{t("app.name")}</span>
            <BrandPeachIcon size={36} className="app-title__peach" animated />
          </h1>
          <p className="tagline">{t("app.tagline")}</p>
        </div>
        <AppHeaderActions
          displayName={displayName}
          username={user?.username}
          photoUrl={user?.photo_url}
        />
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
            <Outlet key={pathname} />
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
        <BottomNav compactNav={compactNav} hasTeam={!!me.teamId} />
      )}
    </div>
  );
}

export function Layout() {
  return (
    <AppPreferencesProvider>
      <MeProvider>
        <LayoutShell />
      </MeProvider>
    </AppPreferencesProvider>
  );
}
