import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { GameSettingsGear } from "./GameSettingsGear";

type Props = {
  displayName?: string;
  username?: string;
  photoUrl?: string;
};

function profileInitials(displayName?: string): string {
  const ch = displayName?.trim().charAt(0);
  return ch ? ch.toUpperCase() : "?";
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
        <GameSettingsGear />
      </Link>
    </div>
  );
}
