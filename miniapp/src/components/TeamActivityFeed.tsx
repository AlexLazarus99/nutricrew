import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { api, type TeamActivityItem } from "../api/client";

export function TeamActivityFeed() {
  const { t } = useTranslation();
  const [items, setItems] = useState<TeamActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getTeamActivity()
      .then((res) => setItems(res.items))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

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
      <ul className="team-activity-list">
        {items.map((item) => (
          <li key={item.id}>
            <span className="activity-name">
              {item.isYou ? t("growth.teamFeedYou") : item.userName}
            </span>
            <span className="activity-meta">
              +{item.points} · {item.description}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
