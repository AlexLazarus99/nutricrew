import { prisma } from "../db/client.js";
import type { AppLocale, MealAnalysis } from "../types.js";

export async function getCachedAnalysis(
  imageHash: string,
  locale: AppLocale,
): Promise<MealAnalysis | null> {
  const row = await prisma.visionCache.findUnique({
    where: { imageHash_locale: { imageHash, locale } },
  });
  if (!row) return null;
  await prisma.visionCache.update({
    where: { imageHash_locale: { imageHash, locale } },
    data: { hitCount: { increment: 1 } },
  });
  return row.result as unknown as MealAnalysis;
}

export async function setCachedAnalysis(
  imageHash: string,
  locale: AppLocale,
  result: MealAnalysis,
): Promise<void> {
  await prisma.visionCache.upsert({
    where: { imageHash_locale: { imageHash, locale } },
    create: { imageHash, locale, result: result as object },
    update: { result: result as object, hitCount: { increment: 1 } },
  });
}
