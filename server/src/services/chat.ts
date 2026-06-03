import { moderateChatMessage } from "../lib/moderation.js";
import * as chatRepo from "../repositories/chat.js";
import type { DbUser } from "../types.js";

const ALLOWED_REACTIONS = ["👍", "❤️", "😂", "🔥", "🎉", "💪", "😮", "🙏"] as const;

export type ChatReactionView = {
  emoji: string;
  count: number;
  mine: boolean;
};

export type ChatMessageView = {
  id: string;
  authorName: string;
  authorId: number | null;
  body: string;
  displayBody: string;
  isHidden: boolean;
  isSystem: boolean;
  isMine: boolean;
  hiddenReason: string | null;
  createdAt: string;
  reactions: ChatReactionView[];
};

function aggregateReactions(
  rows: Array<{ emoji: string; userId: bigint }>,
  viewerId: number,
): ChatReactionView[] {
  const map = new Map<string, { count: number; mine: boolean }>();
  for (const r of rows) {
    const prev = map.get(r.emoji) ?? { count: 0, mine: false };
    map.set(r.emoji, {
      count: prev.count + 1,
      mine: prev.mine || Number(r.userId) === viewerId,
    });
  }
  return [...map.entries()]
    .map(([emoji, v]) => ({ emoji, count: v.count, mine: v.mine }))
    .sort((a, b) => b.count - a.count);
}

function toView(
  msg: Awaited<ReturnType<typeof chatRepo.listTeamMessages>>[number],
  viewer: DbUser,
  locale: "en" | "ru",
): ChatMessageView {
  const authorId = msg.userId ? Number(msg.userId) : null;
  const isMine = authorId === viewer.id;
  const reactions = aggregateReactions(
    msg.reactions.map((r) => ({ emoji: r.emoji, userId: r.userId })),
    viewer.id,
  );

  let displayBody = msg.body;
  if (msg.isSystem) {
    displayBody = msg.body;
  } else if (msg.isHidden && !isMine) {
    displayBody =
      locale === "ru"
        ? "🛡️ Сообщение скрыто модератором NutriCrew"
        : "🛡️ Message hidden by NutriCrew Moderator";
  } else if (msg.isHidden && isMine) {
    displayBody =
      locale === "ru"
        ? `🛡️ Ваше сообщение скрыто (${msg.hiddenReason ?? "правила"})`
        : `🛡️ Your message was hidden (${msg.hiddenReason ?? "rules"})`;
  }

  return {
    id: msg.id,
    authorName: msg.isSystem ? "NutriCrew Moderator" : msg.authorName,
    authorId,
    body: msg.body,
    displayBody,
    isHidden: msg.isHidden,
    isSystem: msg.isSystem,
    isMine,
    hiddenReason: msg.hiddenReason,
    createdAt: msg.createdAt.toISOString(),
    reactions,
  };
}

export async function getTeamChat(
  user: DbUser,
  teamId: string,
): Promise<{ messages: ChatMessageView[]; reactions: string[] }> {
  const rows = await chatRepo.listTeamMessages(teamId, 100);
  const locale = user.locale === "ru" ? "ru" : "en";
  return {
    messages: rows.map((m) => toView(m, user, locale)),
    reactions: [...ALLOWED_REACTIONS],
  };
}

export async function postTeamMessage(
  user: DbUser,
  teamId: string,
  body: string,
): Promise<{ message: ChatMessageView; moderationNotice: string | null }> {
  const locale = user.locale === "ru" ? "ru" : "en";
  const mod = moderateChatMessage(body);
  const authorName = user.first_name || user.username || "Crew";

  const msg = await chatRepo.insertMessage({
    teamId,
    userId: user.id,
    authorName,
    body: body.trim().slice(0, 500),
    isHidden: !mod.allowed,
    hiddenReason: mod.reason,
    isSystem: false,
  });

  let moderationNotice: string | null = null;
  if (!mod.allowed) {
    const systemBody =
      locale === "ru"
        ? `🛡️ Сообщение от ${authorName} скрыто: нарушение правил чата (${mod.reason}).`
        : `🛡️ Message from ${authorName} hidden: chat rules violation (${mod.reason}).`;
    await chatRepo.insertMessage({
      teamId,
      userId: null,
      authorName: "NutriCrew Moderator",
      body: systemBody,
      isHidden: false,
      hiddenReason: null,
      isSystem: true,
    });
    moderationNotice =
      locale === "ru"
        ? "Сообщение скрыто модератором. Будьте вежливы — без мата и спама."
        : "Message hidden by the moderator. Please stay respectful — no profanity or spam.";
  }

  return {
    message: toView(msg, user, locale),
    moderationNotice,
  };
}

export async function reactToMessage(
  user: DbUser,
  teamId: string,
  messageId: string,
  emoji: string,
): Promise<ChatMessageView | null> {
  if (!ALLOWED_REACTIONS.includes(emoji as (typeof ALLOWED_REACTIONS)[number])) {
    return null;
  }

  const msg = await chatRepo.findMessage(messageId);
  if (!msg || msg.teamId !== teamId) return null;

  await chatRepo.toggleReaction(messageId, user.id, emoji);

  const updated = await chatRepo.findMessage(messageId);
  if (!updated) return null;

  const locale = user.locale === "ru" ? "ru" : "en";
  return toView(updated, user, locale);
}
