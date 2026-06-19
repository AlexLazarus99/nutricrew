import { prisma } from "../db/client.js";
import { config } from "../config.js";
import { isAdminTelegramUsername } from "../lib/adminUsers.js";
import { isUserPro } from "./userPro.js";
export type UserAccessStatus = {
  hasAccess: boolean;
  inTrial: boolean;
  trialEndsAt: string;
  liteCrewUntil: string | null;
  hasLiteCrew: boolean;
  trialHoursLeft: number;
};

function trialEndsAt(createdAt: Date): Date {
  return new Date(createdAt.getTime() + config.app.trialHours * 60 * 60 * 1000);
}

export async function getUserAccessStatus(userId: number): Promise<UserAccessStatus> {
  const user = await prisma.user.findUnique({
    where: { id: BigInt(userId) },
    select: { createdAt: true, liteCrewUntil: true, username: true },
  });

  if (!user) {
    const now = new Date();
    return {
      hasAccess: false,
      inTrial: false,
      trialEndsAt: now.toISOString(),
      liteCrewUntil: null,
      hasLiteCrew: false,
      trialHoursLeft: 0,
    };
  }

  if (isAdminTelegramUsername(user.username)) {
    const trialEnd = trialEndsAt(user.createdAt);
    return {
      hasAccess: true,
      inTrial: false,
      trialEndsAt: trialEnd.toISOString(),
      liteCrewUntil: null,
      hasLiteCrew: true,
      trialHoursLeft: 0,
    };
  }

  const now = Date.now();
  const trialEnd = trialEndsAt(user.createdAt);
  const inTrial = trialEnd.getTime() > now;
  const liteCrewActive =
    !!user.liteCrewUntil && user.liteCrewUntil.getTime() > now;
  const proActive = await isUserPro(userId);
  const hasAccess = inTrial || liteCrewActive || proActive;

  return {
    hasAccess,
    inTrial,
    trialEndsAt: trialEnd.toISOString(),
    liteCrewUntil: liteCrewActive ? user.liteCrewUntil!.toISOString() : null,
    hasLiteCrew: liteCrewActive,
    trialHoursLeft: inTrial
      ? Math.max(1, Math.ceil((trialEnd.getTime() - now) / (60 * 60 * 1000)))
      : 0,
  };
}

export async function hasAppAccess(userId: number): Promise<boolean> {
  const status = await getUserAccessStatus(userId);
  return status.hasAccess;
}
