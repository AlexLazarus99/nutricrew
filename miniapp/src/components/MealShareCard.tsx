import { useState } from "react";
import { useTranslation } from "react-i18next";
import { shareMealResult } from "../lib/telegramShare";

type Props = {
  points: number;
  teamPoints: number;
  streak: number;
  inviteUrl?: string | null;
};

export function MealShareCard({ points, teamPoints, streak, inviteUrl }: Props) {
  const { t } = useTranslation();
  const [feedback, setFeedback] = useState<string | null>(null);

  function onShare() {
    const text = t("growth.mealShareText", {
      points,
      team: teamPoints,
      streak,
    });
    const result = shareMealResult({ text, inviteUrl });
    if (result === "shared") setFeedback(t("growth.mealShared"));
    else if (result === "copied") setFeedback(t("growth.mealCopied"));
    else setFeedback(t("growth.mealShareFailed"));
    window.setTimeout(() => setFeedback(null), 2500);
  }

  return (
    <div className="card meal-share-card">
      <p className="success">{t("log.success", { points, team: teamPoints, streak })}</p>
      <button type="button" className="btn btn-secondary btn-block" onClick={onShare}>
        {t("growth.mealShareBtn")}
      </button>
      {feedback && <p className="muted small">{feedback}</p>}
    </div>
  );
}
