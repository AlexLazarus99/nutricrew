import { prisma } from "../db/client.js";
import { isAdminTelegramUsername } from "../lib/adminUsers.js";

export async function isUserPro(userId: number): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: BigInt(userId) },
    select: { isPro: true, proUntil: true, username: true },
  });
  if (!user) return false;
  if (isAdminTelegramUsername(user.username)) return true;
  if (!user.isPro) return false;
  if (!user.proUntil) return true;
  return user.proUntil.getTime() > Date.now();
}

export async function setUserPro(userId: number, days: number): Promise<void> {
  const until = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  await setUserProUntil(userId, until);
}

export async function setUserProUntil(userId: number, until: Date): Promise<void> {
  const active = until.getTime() > Date.now();
  await prisma.user.update({
    where: { id: BigInt(userId) },
    data: {
      isPro: active,
      proUntil: until,
    },
  });
}

export async function getUserProStatus(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: BigInt(userId) },
    select: { isPro: true, proUntil: true, username: true },
  });
  if (user && isAdminTelegramUsername(user.username)) {
    return { isPro: true, proUntil: null };
  }
  const active = await isUserPro(userId);
  return {
    isPro: active,
    proUntil: active ? user?.proUntil?.toISOString() ?? null : null,
  };
}
