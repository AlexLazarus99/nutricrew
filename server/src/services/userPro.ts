import { prisma } from "../db/client.js";

export async function isUserPro(userId: number): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: BigInt(userId) },
    select: { isPro: true, proUntil: true },
  });
  if (!user?.isPro) return false;
  if (!user.proUntil) return true;
  return user.proUntil.getTime() > Date.now();
}

export async function setUserPro(userId: number, days: number): Promise<void> {
  const until = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  await prisma.user.update({
    where: { id: BigInt(userId) },
    data: { isPro: true, proUntil: until },
  });
}

export async function getUserProStatus(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: BigInt(userId) },
    select: { isPro: true, proUntil: true },
  });
  const active = await isUserPro(userId);
  return {
    isPro: active,
    proUntil: active ? user?.proUntil?.toISOString() ?? null : null,
  };
}
