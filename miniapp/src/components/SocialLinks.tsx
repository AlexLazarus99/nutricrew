import { useTranslation } from "react-i18next";
import { openExternalLink } from "../lib/openExternalLink";

export type SocialLinksMap = Partial<{
  telegramChannel: string;
  telegramGroup: string;
  instagram: string;
  x: string;
  youtube: string;
  tiktok: string;
}>;

const SOCIAL_META: Array<{
  key: keyof SocialLinksMap;
  labelKey: string;
  icon: string;
}> = [
  { key: "telegramChannel", labelKey: "social.telegramChannel", icon: "📢" },
  { key: "telegramGroup", labelKey: "social.telegramGroup", icon: "💬" },
  { key: "instagram", labelKey: "social.instagram", icon: "📷" },
  { key: "x", labelKey: "social.x", icon: "𝕏" },
  { key: "youtube", labelKey: "social.youtube", icon: "▶️" },
  { key: "tiktok", labelKey: "social.tiktok", icon: "🎵" },
];

type Props = {
  links: SocialLinksMap;
  variant?: "footer" | "card";
};

export function SocialLinks({ links, variant = "footer" }: Props) {
  const { t } = useTranslation();
  const items = SOCIAL_META.filter((m) => links[m.key]);

  if (items.length === 0) return null;

  return (
    <div className={`social-links social-links--${variant}`}>
      {variant === "card" && <h3 className="social-links-title">{t("social.title")}</h3>}
      <p className="muted small social-links-hint">{t("social.hint")}</p>
      <div className="social-links-row">
        {items.map((item) => (
          <button
            key={item.key}
            type="button"
            className="social-link-btn"
            onClick={() => openExternalLink(links[item.key]!)}
            title={t(item.labelKey)}
          >
            <span className="social-link-icon" aria-hidden>
              {item.icon}
            </span>
            <span className="social-link-label">{t(item.labelKey)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
