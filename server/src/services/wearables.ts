import { prisma } from "../db/client.js";
import { syncHealthStepsForUser } from "./stepsRewards.js";

const WEARABLE_SOURCE_MAP: Record<string, string> = {
  apple_health: "apple_health",
  apple_health_json: "apple_health",
  health_connect: "health_connect",
  google_fit: "google_fit",
  samsung_health: "samsung_health",
};

export async function importWearablePayload(
  userId: number,
  source: string,
  payload: unknown,
) {
  const row = await prisma.wearableImport.create({
    data: {
      userId: BigInt(userId),
      source: source.slice(0, 32),
      payload: payload as object,
    },
  });
  const data = payload as { steps?: number; activeCalories?: number; weightKg?: number };
  let stepsSync = null;
  const mapped = WEARABLE_SOURCE_MAP[source] ?? null;
  if (mapped && Number.isFinite(data.steps) && (data.steps ?? 0) > 0) {
    stepsSync = await syncHealthStepsForUser(userId, Number(data.steps), mapped, new Date());
  }
  return {
    id: row.id,
    imported: true,
    summary: {
      steps: stepsSync?.steps ?? data.steps ?? null,
      activeCalories: data.activeCalories ?? null,
      weightKg: data.weightKg ?? null,
      stepsXpGrantedNow: stepsSync?.stepsXpGrantedNow ?? 0,
    },
  };
}

export async function listWearableImports(userId: number, limit = 10) {
  const rows = await prisma.wearableImport.findMany({
    where: { userId: BigInt(userId) },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return rows.map((r) => ({
    id: r.id,
    source: r.source,
    createdAt: r.createdAt.toISOString(),
  }));
}
