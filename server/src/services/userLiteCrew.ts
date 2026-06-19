import { prisma } from "../db/client.js";

export async function isUserLiteCrew(userId: number): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: BigInt(userId) },
    select: { liteCrewUntil: true },
  });
  if (!user?.liteCrewUntil) return false;
  return user.liteCrewUntil.getTime() > Date.now();
}

export async function setLiteCrewUntil(userId: number, until: Date): Promise<void> {
  await prisma.user.update({
    where: { id: BigInt(userId) },
    data: { liteCrewUntil: until },
  });
}
