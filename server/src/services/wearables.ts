import { prisma } from "../db/client.js";
import * as wellnessRepo from "../repositories/wellness.js";

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
  let syncedSteps: number | null = null;
  if (Number.isFinite(data.steps) && (data.steps ?? 0) > 0) {
    syncedSteps = await wellnessRepo.setStepsTotal(userId, Number(data.steps), new Date());
  }
  return {
    id: row.id,
    imported: true,
    summary: {
      steps: syncedSteps ?? data.steps ?? null,
      activeCalories: data.activeCalories ?? null,
      weightKg: data.weightKg ?? null,
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
