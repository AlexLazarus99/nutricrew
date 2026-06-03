import { useTranslation } from "react-i18next";
import { CalorieQuizGame } from "../components/quiz/CalorieQuizGame";
import { useMe } from "../hooks/useMe";

export function CalorieQuizPage() {
  const { t } = useTranslation();
  const { refresh } = useMe();

  return (
    <section className="stack calorie-quiz-page">
      <div className="card hero calorie-quiz-hero">
        <h2>{t("quiz.title")}</h2>
        <p className="muted small">{t("quiz.subtitle")}</p>
      </div>
      <CalorieQuizGame onActivity={refresh} />
    </section>
  );
}
