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

/** Voice logs via audio or typed text (legacy events included). */
export async function countVoiceAnalyzeToday(userId: number): Promise<number> {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  const user = BigInt(userId);
  const [voiceEvents, legacyTextVoice] = await Promise.all([
    prisma.analyticsEvent.count({
      where: { userId: user, eventName: "meal_analyze_voice", createdAt: { gte: start } },
    }),
    prisma.analyticsEvent.count({
      where: {
        userId: user,
        eventName: "meal_analyze_text",
        createdAt: { gte: start },
        OR: [
          { props: { path: ["kind"], equals: "voice_audio" } },
          { props: { path: ["source"], equals: "voice" } },
        ],
      },
    }),
  ]);
  return voiceEvents + legacyTextVoice;
}
