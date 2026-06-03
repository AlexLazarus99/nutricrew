import { useState } from "react";
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

  const btnClass =
    variant === "primary" ? "btn btn-primary btn-block" : "btn btn-secondary btn-block";

  return (
    <div className={className}>
      <button type="button" className={btnClass} onClick={onShare}>
        {t("growth.inviteShareBtn")}
      </button>
      {feedback && <p className="muted small share-feedback">{feedback}</p>}
    </div>
  );
}
