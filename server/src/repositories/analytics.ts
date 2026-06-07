import type { Prisma } from "@prisma/client";
import { prisma } from "../db/client.js";

export async function insertEvents(
  events: Array<{
    userId?: number | null;
    eventName: string;
    props?: Record<string, unknown>;
  }>,
): Promise<void> {
  if (events.length === 0) return;
  await prisma.analyticsEvent.createMany({
    data: events.map((e) => ({
      userId: e.userId != null ? BigInt(e.userId) : null,
      eventName: e.eventName.slice(0, 64),
      props: (e.props ?? {}) as Prisma.InputJsonValue,
    })),
  });
}

export async function countEventsToday(userId: number, eventName: string): Promise<number> {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  return prisma.analyticsEvent.count({
    where: {
      userId: BigInt(userId),
      eventName,
      createdAt: { gte: start },
    },
  });
}
