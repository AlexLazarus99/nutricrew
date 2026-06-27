import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { shareInviteLink } from "../lib/telegramShare";

type Props = {
  inviteCode: string;
  botUsername?: string | null;
  inviteUrl?: string | null;
  referrerTelegramId?: number;
  variant?: "primary" | "secondary";
  className?: string;
};

function TelegramInviteIcon() {
  const uid = useId().replace(/:/g, "");
  const g = (name: string) => `url(#${uid}-${name})`;

  return (
    <span className="invite-share-cta__icon" aria-hidden>
      <span className="invite-share-cta__icon-ring" />
      <span className="invite-share-cta__icon-glow" />
      <svg className="invite-share-cta__svg" viewBox="0 0 64 64">
        <defs>
          <linearGradient id={`${uid}-bg`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7dd3fc" />
            <stop offset="100%" stopColor="#38bdf8" />
          </linearGradient>
          <linearGradient id={`${uid}-plane`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#e0f7fa" />
          </linearGradient>
        </defs>
        <circle cx="32" cy="32" r="24" fill={g("bg")} />
        <path
          className="invite-share-cta__plane"
          d="M18 32 L46 20 L38 44 L30 36 L22 40 Z"
          fill={g("plane")}
        />
        <circle className="invite-share-cta__spark invite-share-cta__spark--1" cx="48" cy="18" r="2.5" fill="#fff59d" />
        <circle className="invite-share-cta__spark invite-share-cta__spark--2" cx="14" cy="22" r="2" fill="#b3e5fc" />
        <circle className="invite-share-cta__spark invite-share-cta__spark--3" cx="50" cy="46" r="1.8" fill="#81d4fa" />
      </svg>
    </span>
  );
}

export function InviteShareButton({
  inviteCode,
  botUsername,
  inviteUrl,
  referrerTelegramId,
  variant = "primary",
  className = "",
}: Props) {
  const { t } = useTranslation();
  const [feedback, setFeedback] = useState<string | null>(null);

  function onShare() {
    const result = shareInviteLink({
      inviteCode,
      botUsername,
      inviteUrl,
      referrerTelegramId,
      title: t("growth.inviteShareTitle"),
      text: t("growth.inviteShareText", { code: inviteCode }),
    });
    if (result === "shared") setFeedback(t("growth.inviteShared"));
    else if (result === "copied") setFeedback(t("growth.inviteCopied"));
    else setFeedback(t("growth.inviteShareFailed"));
    window.setTimeout(() => setFeedback(null), 2500);
  }

  return (
    <div className={className}>
      <button
        type="button"
        className={[
          "invite-share-cta",
          variant === "secondary" ? "invite-share-cta--compact" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        onClick={onShare}
      >
        <span className="invite-share-cta__aurora" aria-hidden />
        <span className="invite-share-cta__shimmer" aria-hidden />
        <span className="invite-share-cta__bubbles" aria-hidden>
          <span className="invite-share-cta__bubble invite-share-cta__bubble--1" />
          <span className="invite-share-cta__bubble invite-share-cta__bubble--2" />
          <span className="invite-share-cta__bubble invite-share-cta__bubble--3" />
        </span>
        <span className="invite-share-cta__body">
          <TelegramInviteIcon />
          <span className="invite-share-cta__label">{t("growth.inviteShareBtn")}</span>
        </span>
      </button>
      {feedback && <p className="muted small share-feedback">{feedback}</p>}
    </div>
  );
}
