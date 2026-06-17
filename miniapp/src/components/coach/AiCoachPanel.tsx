import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../../api/client";
import { trackEvent } from "../../lib/analytics";

type Message = {
  id: string;
  role: "user" | "coach";
  text: string;
};

const PROMPT_KEYS = [
  "coach.promptBreakfast",
  "coach.promptProtein",
  "coach.promptDeficit",
  "coach.promptSnack",
] as const;

export function AiCoachPanel() {
  const { t } = useTranslation();
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const prompts = PROMPT_KEYS.map((key) => t(key));

  function scrollToBottom() {
    requestAnimationFrame(() => {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
    });
  }

  async function send(text: string) {
    const q = text.trim();
    if (!q || busy) return;

    const userMsg: Message = { id: `u-${Date.now()}`, role: "user", text: q };
    setMessages((prev) => [...prev, userMsg]);
    setQuestion("");
    setBusy(true);
    setError(null);
    scrollToBottom();

    try {
      const res = await api.proCoach(q);
      setMessages((prev) => [...prev, { id: `c-${Date.now()}`, role: "coach", text: res.answer }]);
      trackEvent("coach_reply", { length: res.answer.length });
    } catch (e) {
      const msg = (e as Error).message;
      if (msg === "PRO_REQUIRED") {
        setError(t("coach.proRequired"));
      } else {
        setError(msg);
      }
    } finally {
      setBusy(false);
      scrollToBottom();
    }
  }

  return (
    <section className="stack coach-page">
      <div className="card coach-hero">
        <div className="coach-hero__avatar" aria-hidden>
          🍑
        </div>
        <div>
          <h2 className="coach-hero__title">{t("coach.title")}</h2>
          <p className="coach-hero__sub muted">{t("coach.subtitle")}</p>
        </div>
      </div>

      <div className="card coach-chat">
        <div className="coach-chat__list" ref={listRef}>
          {messages.length === 0 ? (
            <div className="coach-chat__welcome">
              <p>{t("coach.welcome")}</p>
              <p className="muted small">{t("coach.welcomeHint")}</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`coach-chat__bubble coach-chat__bubble--${msg.role}`}
              >
                <span className="coach-chat__role">
                  {msg.role === "user" ? t("coach.you") : t("coach.coach")}
                </span>
                <p>{msg.text}</p>
              </div>
            ))
          )}
          {busy && (
            <div className="coach-chat__bubble coach-chat__bubble--coach coach-chat__bubble--typing">
              <span className="coach-chat__role">{t("coach.coach")}</span>
              <p className="muted">{t("coach.asking")}</p>
            </div>
          )}
        </div>

        <div className="coach-chat__prompts">
          {prompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              className="coach-chat__chip"
              disabled={busy}
              onClick={() => {
                setQuestion(prompt);
                void send(prompt);
              }}
            >
              {prompt}
            </button>
          ))}
        </div>

        <form
          className="coach-chat__form"
          onSubmit={(e) => {
            e.preventDefault();
            void send(question);
          }}
        >
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={t("coach.placeholder")}
            rows={2}
            disabled={busy}
            maxLength={400}
          />
          <button type="submit" className="btn btn-primary" disabled={busy || !question.trim()}>
            {busy ? t("coach.asking") : t("coach.ask")}
          </button>
        </form>
      </div>

      {error && <p className="error">{error}</p>}
    </section>
  );
}
