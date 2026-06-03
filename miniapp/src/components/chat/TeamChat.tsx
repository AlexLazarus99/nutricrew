import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api, type ChatMessage } from "../../api/client";

const POLL_MS = 3500;

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
  return (name[0] ?? "?").toUpperCase();
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

type Props = {
  hasTeam: boolean;
};

export function TeamChat({ hasTeam }: Props) {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [allowedReactions, setAllowedReactions] = useState<string[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const load = useCallback(async (silent = false) => {
    if (!hasTeam) return;
    try {
      const data = await api.getChatMessages();
      setMessages(data.messages);
      setAllowedReactions(data.reactions);
      setError(null);
      if (!silent) setLoading(false);
    } catch (e) {
      if (!silent) setError((e as Error).message);
      setLoading(false);
    }
  }, [hasTeam]);

  useEffect(() => {
    void load();
    if (!hasTeam) return;
    const id = window.setInterval(() => void load(true), POLL_MS);
    return () => window.clearInterval(id);
  }, [hasTeam, load]);

  useEffect(() => {
    scrollToBottom();
  }, [messages.length, scrollToBottom]);

  async function onSend(e: FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    setNotice(null);
    try {
      const res = await api.postChatMessage(body);
      setMessages(res.messages);
      setText("");
      if (res.moderationNotice) setNotice(res.moderationNotice);
      scrollToBottom();
    } catch (err) {
      setNotice((err as Error).message);
    } finally {
      setSending(false);
    }
  }

  async function onReact(messageId: string, emoji: string) {
    try {
      const { message } = await api.reactChatMessage(messageId, emoji);
      setMessages((prev) => prev.map((m) => (m.id === messageId ? message : m)));
    } catch {
      /* ignore */
    }
  }

  if (!hasTeam) {
    return (
      <div className="card chat-empty">
        <p className="chat-empty-emoji" aria-hidden>
          💬
        </p>
        <h3>{t("chat.needTeamTitle")}</h3>
        <p className="muted">{t("chat.needTeamHint")}</p>
        <Link to="/" className="btn btn-primary btn-block">
          {t("chat.needTeamCta")}
        </Link>
      </div>
    );
  }

  return (
    <div className="team-chat">
      <div className="chat-header card">
        <div className="chat-header-mascot" aria-hidden>
          🛡️
        </div>
        <div>
          <h2>{t("chat.title")}</h2>
          <p className="muted small">{t("chat.subtitle")}</p>
        </div>
      </div>

      {notice && <p className="chat-notice">{notice}</p>}
      {error && <p className="error-text">{error}</p>}

      <div className="chat-messages-wrap" ref={listRef}>
        {loading && <p className="muted small chat-loading">{t("common.loading")}</p>}
        {!loading && messages.length === 0 && (
          <p className="muted small chat-empty-list">{t("chat.empty")}</p>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`chat-bubble-row ${msg.isMine ? "mine" : ""} ${msg.isSystem ? "system" : ""} ${
              msg.isHidden ? "hidden-msg" : ""
            }`}
          >
            {!msg.isSystem && (
              <span className="chat-avatar" aria-hidden>
                {initials(msg.authorName)}
              </span>
            )}
            <div className={`chat-bubble ${msg.isSystem ? "chat-bubble--mod" : ""}`}>
              <div className="chat-bubble-meta">
                <span className="chat-author">{msg.authorName}</span>
                <span className="chat-time">{formatTime(msg.createdAt)}</span>
              </div>
              <p className="chat-body">{msg.displayBody}</p>
              {!msg.isSystem && !msg.isHidden && allowedReactions.length > 0 && (
                <div className="chat-reactions-bar">
                  {allowedReactions.map((emoji) => {
                    const r = msg.reactions.find((x) => x.emoji === emoji);
                    const active = r?.mine;
                    return (
                      <button
                        key={emoji}
                        type="button"
                        className={`chat-reaction-btn ${active ? "active" : ""}`}
                        onClick={() => void onReact(msg.id, emoji)}
                        title={emoji}
                      >
                        {emoji}
                        {r && r.count > 0 ? <span className="chat-reaction-count">{r.count}</span> : null}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form className="chat-composer card" onSubmit={onSend}>
        <input
          type="text"
          maxLength={500}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t("chat.placeholder")}
          aria-label={t("chat.placeholder")}
        />
        <button type="submit" className="btn btn-primary" disabled={sending || !text.trim()}>
          {sending ? "…" : "➤"}
        </button>
      </form>
      <p className="muted small chat-rules">{t("chat.rules")}</p>
    </div>
  );
}
