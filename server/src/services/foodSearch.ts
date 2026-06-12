import { prisma } from "../db/client.js";
import { searchProducts } from "./barcodeLookup.js";

export async function cachedFoodSearch(query: string, locale: string, limit = 12) {
  const key = `${locale}:${query.toLowerCase().trim()}`.slice(0, 120);
  const now = new Date();
  const cached = await prisma.foodSearchCache.findUnique({ where: { queryKey: key } });
  if (cached && cached.expiresAt > now) {
    return cached.results as Awaited<ReturnType<typeof searchProducts>>;
  }
  const results = await searchProducts(query, locale, limit);
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  await prisma.foodSearchCache.upsert({
    where: { queryKey: key },
    create: { queryKey: key, locale, results, expiresAt },
    update: { results, expiresAt, locale },
  });
  return results;
}
