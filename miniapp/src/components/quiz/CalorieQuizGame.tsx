import { useCallback, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { FoodCategory } from "../../data/calorieQuiz/foods";
import { FOOD_CATEGORIES, atwaterBreakdown } from "../../data/calorieQuiz/foods";
import {
  QUESTIONS_PER_GAME,
  createDeck,
  finishGame,
  isGameComplete,
  loadBestScore,
  nextQuestion,
  questionsInDeck,
  saveBestScore,
  type QuizDeck,
  type QuizQuestion,
} from "../../lib/calorieQuiz/engine";

type Phase = "ready" | "playing" | "revealed" | "finished";

export function CalorieQuizGame() {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<Phase>("ready");
  const [question, setQuestion] = useState<QuizQuestion | null>(null);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => loadBestScore());
  const [picked, setPicked] = useState<number | null>(null);
  const [category, setCategory] = useState<FoodCategory | "all">("all");
  const [totalQuestions, setTotalQuestions] = useState(QUESTIONS_PER_GAME);
  const [questionNumber, setQuestionNumber] = useState(0);
  const deckRef = useRef<QuizDeck | null>(null);

  const categoryFilter = category === "all" ? undefined : category;

  const startRound = useCallback(() => {
    if (!deckRef.current || deckRef.current.category !== categoryFilter) {
      deckRef.current = createDeck(categoryFilter);
      setTotalQuestions(questionsInDeck(deckRef.current));
    }

    const result = nextQuestion(deckRef.current);
    if (!result) {
      finishGame(deckRef.current);
      setPhase("finished");
      return;
    }

    deckRef.current = result.deck;
    setQuestionNumber(result.deck.questionNumber);
    setQuestion(result.question);
    setPicked(null);
    setPhase("playing");
  }, [categoryFilter]);

  const onStart = () => {
    setScore(0);
    setQuestionNumber(0);
    deckRef.current = createDeck(categoryFilter);
    setTotalQuestions(questionsInDeck(deckRef.current));
    startRound();
  };

  const onCategoryChange = (cat: FoodCategory | "all") => {
    if (phase === "playing" || phase === "revealed") return;
    setCategory(cat);
    deckRef.current = null;
  };

  const onPick = (kcal: number) => {
    if (phase !== "playing" || !question || picked !== null) return;
    setPicked(kcal);
    setPhase("revealed");
    const correct = kcal === question.correctKcal;
    if (correct) {
      const nextScore = score + 1;
      setScore(nextScore);
      if (nextScore > best) {
        setBest(nextScore);
        saveBestScore(nextScore);
      }
    }
  };

  const onNext = () => {
    if (deckRef.current && isGameComplete(deckRef.current)) {
      finishGame(deckRef.current);
      setPhase("finished");
      return;
    }
    startRound();
  };

  const onPlayAgain = () => {
    deckRef.current = null;
    setQuestion(null);
    setPicked(null);
    onStart();
  };

  const onBackToMenu = () => {
    if (deckRef.current && phase !== "ready") {
      finishGame(deckRef.current);
    }
    deckRef.current = null;
    setQuestion(null);
    setPicked(null);
    setPhase("ready");
  };

  const portionLabel = useMemo(() => {
    if (!question) return "";
    return question.food.unit === "ml"
      ? t("quiz.per100ml")
      : t("quiz.per100g");
  }, [question, t]);

  const filtersDisabled = phase === "playing" || phase === "revealed";

  return (
    <div className="calorie-quiz">
      <div className="calorie-quiz-meta">
        <span>
          {t("quiz.progress", {
            current: questionNumber,
            total: totalQuestions,
          })}
        </span>
        <span>
          {t("quiz.score")}: <strong>{score}</strong>
        </span>
        <span>
          {t("quiz.best")}: <strong>{best}</strong>
        </span>
      </div>

      <div className="calorie-quiz-filters">
        <button
          type="button"
          className={`chip ${category === "all" ? "chip-active" : ""}`}
          disabled={filtersDisabled}
          onClick={() => onCategoryChange("all")}
        >
          {t("quiz.allCategories")}
        </button>
        {FOOD_CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            className={`chip ${category === cat ? "chip-active" : ""}`}
            disabled={filtersDisabled}
            onClick={() => onCategoryChange(cat)}
          >
            {t(`quiz.categories.${cat}`)}
          </button>
        ))}
      </div>

      <div className="card calorie-quiz-card">
        {phase === "ready" && (
          <div className="calorie-quiz-ready">
            <p className="calorie-quiz-emoji">🥗</p>
            <h3>{t("quiz.startTitle")}</h3>
            <p className="muted small">{t("quiz.startHint", { count: QUESTIONS_PER_GAME })}</p>
            <button type="button" className="btn btn-primary" onClick={onStart}>
              {t("quiz.startBtn")}
            </button>
          </div>
        )}

        {phase === "finished" && (
          <div className="calorie-quiz-ready">
            <p className="calorie-quiz-emoji">🏁</p>
            <h3>{t("quiz.gameOverTitle")}</h3>
            <p className="muted small">
              {t("quiz.gameOverHint", { score, total: totalQuestions })}
            </p>
            <button type="button" className="btn btn-primary btn-block" onClick={onPlayAgain}>
              {t("quiz.playAgain")}
            </button>
            <button type="button" className="btn btn-secondary btn-block" onClick={onBackToMenu}>
              {t("quiz.backToMenu")}
            </button>
          </div>
        )}

        {(phase === "playing" || phase === "revealed") && question && (
          <>
            <div className="calorie-quiz-product">
              <span className="calorie-quiz-product-emoji" aria-hidden>
                {question.food.emoji}
              </span>
              <div>
                <p className="calorie-quiz-category">
                  {t(`quiz.categories.${question.food.category}`)}
                </p>
                <h3>{t(`quiz.foods.${question.food.id}`)}</h3>
                <p className="muted small">{portionLabel}</p>
              </div>
            </div>

            <p className="calorie-quiz-prompt">{t("quiz.question")}</p>

            <div className="calorie-quiz-options">
              {question.options.map((kcal) => {
                const isPicked = picked === kcal;
                const isCorrect = kcal === question.correctKcal;
                let stateClass = "";
                if (phase === "revealed") {
                  if (isCorrect) stateClass = "option-correct";
                  else if (isPicked) stateClass = "option-wrong";
                }
                return (
                  <button
                    key={kcal}
                    type="button"
                    className={`calorie-quiz-option ${stateClass}`}
                    disabled={phase === "revealed"}
                    onClick={() => onPick(kcal)}
                  >
                    {t("quiz.kcalOption", { value: kcal })}
                  </button>
                );
              })}
            </div>

            {phase === "revealed" && question && (
              <div className="calorie-quiz-feedback">
                <p>
                  {picked === question.correctKcal
                    ? t("quiz.correct")
                    : t("quiz.wrong", { value: question.correctKcal })}
                </p>
                <div className="calorie-quiz-nutrition">
                  <p className="muted small">
                    {t("quiz.macrosLine", {
                      protein: question.food.macros.proteinG,
                      fat: question.food.macros.fatG,
                      carbs: question.food.macros.carbsG,
                    })}
                  </p>
                  {(() => {
                    const b = atwaterBreakdown(question.food.macros);
                    return (
                      <p className="muted small">
                        {t("quiz.atwaterLine", {
                          p: b.fromProtein,
                          c: b.fromCarbs + b.fromFiber,
                          f: b.fromFat,
                          kcal: question.correctKcal,
                        })}
                      </p>
                    );
                  })()}
                  <p className="muted small calorie-quiz-source">
                    {t(`quiz.sources.${question.food.source}`)}
                  </p>
                </div>
                <button type="button" className="btn btn-primary btn-block" onClick={onNext}>
                  {questionNumber >= totalQuestions
                    ? t("quiz.finish")
                    : t("quiz.next")}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <p className="muted small calorie-quiz-footnote">
        {t("quiz.footnote", { count: QUESTIONS_PER_GAME })}
      </p>
    </div>
  );
}
