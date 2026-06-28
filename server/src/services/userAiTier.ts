import { isUserLiteCrew } from "./userLiteCrew.js";
import { isUserPro } from "./userPro.js";

export type AiTier = "free" | "lite" | "pro";

export const ANALYZE_LIMIT_BY_TIER: Record<AiTier, number> = {
  free: 20,
  lite: 35,
  pro: 80,
};

export const VOICE_LIMIT_BY_TIER: Record<AiTier, number> = {
  free: 5,
  lite: 15,
  pro: 999,
};

export async function getUserAiTier(userId: number): Promise<AiTier> {
  if (await isUserPro(userId)) return "pro";
  if (await isUserLiteCrew(userId)) return "lite";
  return "free";
}

export async function getAnalyzeLimit(userId: number): Promise<number> {
  const tier = await getUserAiTier(userId);
  return ANALYZE_LIMIT_BY_TIER[tier];
}

export async function getVoiceAnalyzeLimit(userId: number): Promise<number> {
  const tier = await getUserAiTier(userId);
  return VOICE_LIMIT_BY_TIER[tier];
}

export async function hasLiteAiFeatures(userId: number): Promise<boolean> {
  const tier = await getUserAiTier(userId);
  return tier === "lite" || tier === "pro";
}
