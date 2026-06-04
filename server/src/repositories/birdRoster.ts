import { prisma } from "../db/client.js";

export async function ensureClassicUnlocked(userId: number): Promise<void> {
  await prisma.userBird.upsert({
    where: { userId_birdId: { userId: BigInt(userId), birdId: "classic" } },
    create: { userId: BigInt(userId), birdId: "classic" },
    update: {},
  });
}

export async function listOwnedBirdIds(userId: number): Promise<string[]> {
  const rows = await prisma.userBird.findMany({
    where: { userId: BigInt(userId) },
    select: { birdId: true },
  });
  return rows.map((r) => r.birdId);
}

export async function unlockBird(userId: number, birdId: string): Promise<void> {
  await prisma.userBird.upsert({
    where: { userId_birdId: { userId: BigInt(userId), birdId } },
    create: { userId: BigInt(userId), birdId },
    update: {},
  });
}

export async function hasBird(userId: number, birdId: string): Promise<boolean> {
  const row = await prisma.userBird.findUnique({
    where: { userId_birdId: { userId: BigInt(userId), birdId } },
  });
  return !!row;
}

export async function getSelectedBirdId(userId: number): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: BigInt(userId) },
    select: { selectedBirdId: true },
  });
  return user?.selectedBirdId ?? "classic";
}

export async function setSelectedBird(userId: number, birdId: string): Promise<void> {
  await prisma.user.update({
    where: { id: BigInt(userId) },
    data: { selectedBirdId: birdId },
  });
}

export async function listCompletedTrialIds(userId: number): Promise<string[]> {
  const rows = await prisma.userBirdTrial.findMany({
    where: { userId: BigInt(userId) },
    select: { trialId: true },
  });
  return rows.map((r) => r.trialId);
}

export async function completeTrial(
  userId: number,
  trialId: string,
  levelReached: number,
): Promise<boolean> {
  const existing = await prisma.userBirdTrial.findUnique({
    where: { userId_trialId: { userId: BigInt(userId), trialId } },
  });
  if (existing) return false;

  await prisma.userBirdTrial.create({
    data: {
      userId: BigInt(userId),
      trialId,
      levelReached,
    },
  });
  return true;
}
