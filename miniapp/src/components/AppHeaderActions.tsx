import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

type Props = {
  displayName?: string;
  username?: string;
  photoUrl?: string;
};

function profileInitials(displayName?: string): string {
  const ch = displayName?.trim().charAt(0);
  return ch ? ch.toUpperCase() : "?";
}

function SettingsGearIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 8.25a3.75 3.75 0 1 0 0 7.5 3.75 3.75 0 0 0 0-7.5Zm9.17 4.38-.98-.17a7.2 7.2 0 0 0-.55-1.33l.58-.84a.75.75 0 0 0-.16-1.03l-1.06-.61a.75.75 0 0 0-1.03.16l-.58.84a7.3 7.3 0 0 0-1.15-.66l-.17-.98a.75.75 0 0 0-.74-.63h-1.22a.75.75 0 0 0-.74.63l-.17.98c-.4.15-.78.36-1.15.66l-.84-.58a.75.75 0 0 0-1.03-.16l-1.06.61a.75.75 0 0 0-.16 1.03l.58.84c-.22.42-.4.87-.55 1.33l-.98.17a.75.75 0 0 0-.63.74v1.22c0 .38.28.7.63.74l.98.17c.15.46.33.91.55 1.33l-.58.84a.75.75 0 0 0 .16 1.03l1.06.61c.3.17.67.1.94-.16l.84-.58c.37.3.75.51 1.15.66l.17.98c.06.35.38.63.74.63h1.22c.38 0 .7-.28.74-.63l.17-.98c.4-.15.78-.36 1.15-.66l.84.58c.27.26.64.33.94.16l1.06-.61a.75.75 0 0 0 .16-1.03l-.58-.84c.22-.42.4-.87.55-1.33l.98-.17a.75.75 0 0 0 .63-.74v-1.22a.75.75 0 0 0-.63-.74Z"
      />
    </svg>
  );
}

export function AppHeaderActions({ displayName, username, photoUrl }: Props) {
  const { t } = useTranslation();
  const nickname = username ? `@${username}` : displayName?.trim() || t("settings.guest");

  return (
    <div className="app-header__actions">
      <div className="app-header__profile" title={nickname}>
        <span className="app-header__avatar">
          {photoUrl ? (
            <img src={photoUrl} alt="" width={36} height={36} decoding="async" />
          ) : (
            <span className="app-header__avatar-fallback">{profileInitials(displayName)}</span>
          )}
        </span>
        <span className="app-header__nickname">{nickname}</span>
      </div>
      <Link to="/settings" className="app-header__settings-btn" aria-label={t("nav.settings")}>
        <SettingsGearIcon />
      </Link>
    </div>
  );
}
