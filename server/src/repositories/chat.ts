import { prisma } from "../db/client.js";

export async function listTeamMessages(teamId: string, limit = 80) {
  const rows = await prisma.chatMessage.findMany({
    where: { teamId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      reactions: true,
    },
  });
  return rows.reverse();
}

export async function findMessage(id: string) {
  return prisma.chatMessage.findUnique({
    where: { id },
    include: { reactions: true },
  });
}

export async function insertMessage(input: {
  teamId: string;
  userId: number | null;
  authorName: string;
  body: string;
  isHidden: boolean;
  hiddenReason: string | null;
  isSystem: boolean;
}) {
  return prisma.chatMessage.create({
    data: {
      teamId: input.teamId,
      userId: input.userId != null ? BigInt(input.userId) : null,
      authorName: input.authorName,
      body: input.body,
      isHidden: input.isHidden,
      hiddenReason: input.hiddenReason,
      isSystem: input.isSystem,
    },
    include: { reactions: true },
  });
}

export async function toggleReaction(
  messageId: string,
  userId: number,
  emoji: string,
): Promise<{ added: boolean }> {
  const existing = await prisma.chatReaction.findUnique({
    where: {
      messageId_userId_emoji: {
        messageId,
        userId: BigInt(userId),
        emoji,
      },
    },
  });

  if (existing) {
    await prisma.chatReaction.delete({
      where: {
        messageId_userId_emoji: {
          messageId,
          userId: BigInt(userId),
          emoji,
        },
      },
    });
    return { added: false };
  }

  await prisma.chatReaction.create({
    data: {
      messageId,
      userId: BigInt(userId),
      emoji,
    },
  });
  return { added: true };
}
