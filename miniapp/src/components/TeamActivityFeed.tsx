import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { api, type TeamActivityItem } from "../api/client";

export function TeamActivityFeed() {
  const { t } = useTranslation();
  const [items, setItems] = useState<TeamActivityItem[]>([]);
  const [kudosEmojis, setKudosEmojis] = useState<string[]>(["🔥", "💪", "🥗", "👏"]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(() => {
    api
      .getTeamActivity()
      .then((res) => {
        setItems(res.items);
        if (res.kudosEmojis?.length) setKudosEmojis(res.kudosEmojis);
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function sendKudos(mealId: string, emoji: string) {
    try {
      await api.postMealKudos(mealId, emoji);
      setToast(t("log.kudosSent"));
      load();
      window.setTimeout(() => setToast(null), 2000);
    } catch {
      /* ignore */
    }
  }

  if (loading) return null;
  if (items.length === 0) {
    return (
      <div className="card">
        <h3>{t("growth.teamFeedTitle")}</h3>
        <p className="muted small">{t("growth.teamFeedEmpty")}</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h3>{t("growth.teamFeedTitle")}</h3>
      {toast && <p className="muted small">{toast}</p>}
      <ul className="team-activity-list">
        {items.map((item) => (
          <li key={item.id}>
            <span className="activity-name">
              {item.isYou ? t("growth.teamFeedYou") : item.userName}
            </span>
            <span className="activity-meta">
              +{item.points}
              {item.qualityTag ? ` · ${item.qualityTag}` : ""} · {item.description}
            </span>
            {item.photoUrl && (
              <img
                src={item.photoUrl}
                alt=""
                className="activity-thumb"
                style={{ maxWidth: 64, borderRadius: 8, marginTop: 4 }}
              />
            )}
            <div className="team-activity-kudos">
              {(item.kudosCount ?? 0) > 0 && (
                <span className="muted small">{item.kudos?.join("") ?? "🔥"}</span>
              )}
              {!item.isYou &&
                kudosEmojis.map((em) => (
                  <button
                    key={em}
                    type="button"
                    className="kudos-btn"
                    onClick={() => void sendKudos(item.id, em)}
                  >
                    {em}
                  </button>
                ))}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
