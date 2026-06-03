import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { api, type QuestBoard, type QuestItem } from "../api/client";

type Tab = "daily" | "weekly" | "once";

type Props = {
  onClaimed?: () => void;
};

export function QuestsPanel({ onClaimed }: Props) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>("daily");
  const [board, setBoard] = useState<QuestBoard | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await api.getQuests();
      setBoard(data);
    } catch {
      setBoard(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onClaim(quest: QuestItem) {
    if (quest.status !== "ready") return;
    setClaiming(quest.id);
    setToast(null);
    try {
      const res = await api.claimQuest(quest.id);
      setBoard(res.board);
      const parts = [
        res.rewards.xp > 0 ? `+${res.rewards.xp} XP` : "",
        res.rewards.team > 0 ? `+${res.rewards.team} ${t("quests.rewardTeam")}` : "",
        res.rewards.stars > 0 ? `+${res.rewards.stars} ⭐` : "",
      ].filter(Boolean);
      setToast(t("quests.claimedToast", { rewards: parts.join(" · ") }));
      onClaimed?.();
      window.setTimeout(() => setToast(null), 3500);
    } catch (e) {
      setToast((e as Error).message);
    } finally {
      setClaiming(null);
    }
  }

  if (loading) {
    return (
      <div className="card quests-panel">
        <p className="muted small">{t("common.loading")}</p>
      </div>
    );
  }

  if (!board) return null;

  const list =
    tab === "daily" ? board.daily : tab === "weekly" ? board.weekly : board.once;

  return (
    <div className="card quests-panel" data-tutorial="quests-panel">
      <div className="quests-panel-head">
        <div>
          <h3>{t("quests.title")}</h3>
          <p className="muted small">{t("quests.subtitle")}</p>
        </div>
        {board.readyCount > 0 && (
          <span className="quests-ready-badge">{board.readyCount}</span>
        )}
      </div>

      {toast && <p className="quests-toast success small">{toast}</p>}

      <div className="quests-tabs" role="tablist">
        {(["daily", "weekly", "once"] as Tab[]).map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            className={tab === key ? "active" : undefined}
            onClick={() => setTab(key)}
          >
            {t(`quests.tabs.${key}`)}
          </button>
        ))}
      </div>

      <ul className="quests-list">
        {list.length === 0 && (
          <li className="muted small">{t("quests.empty")}</li>
        )}
        {list.map((quest) => (
          <li key={quest.id} className={`quest-item quest-item--${quest.status}`}>
            <span className="quest-emoji" aria-hidden>
              {quest.emoji}
            </span>
            <div className="quest-body">
              <span className="quest-name">{t(`quests.items.${quest.titleKey}.title`)}</span>
              <span className="quest-desc muted small">
                {t(`quests.items.${quest.descKey}.desc`, {
                  target: quest.target,
                  progress: quest.progress,
                })}
              </span>
              <div className="quest-progress-bar">
                <div
                  className="quest-progress-fill"
                  style={{
                    width: `${Math.min(100, Math.round((quest.progress / quest.target) * 100))}%`,
                  }}
                />
              </div>
              <span className="quest-rewards muted small">
                {quest.rewards.xp > 0 && `+${quest.rewards.xp} XP `}
                {quest.rewards.team > 0 && `+${quest.rewards.team} ${t("quests.rewardTeam")} `}
                {quest.rewards.stars > 0 && `+${quest.rewards.stars} ⭐`}
              </span>
            </div>
            <div className="quest-action">
              {quest.status === "claimed" && (
                <span className="quest-done-badge">{t("quests.claimed")}</span>
              )}
              {quest.status === "locked" && (
                <span className="quest-lock muted small">{t("quests.locked")}</span>
              )}
              {quest.status === "active" && (
                <span className="quest-progress-label">
                  {quest.progress}/{quest.target}
                </span>
              )}
              {quest.status === "ready" && (
                <button
                  type="button"
                  className="btn btn-primary btn-sm quest-claim-btn"
                  disabled={claiming === quest.id}
                  onClick={() => void onClaim(quest)}
                >
                  {claiming === quest.id ? "…" : t("quests.claim")}
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
