/** Shared lazy loaders so prefetch warms the same chunk as React.lazy(). */

export const loadLogMealPage = () =>
  import("../pages/LogMeal").then((m) => ({ default: m.LogMealPage }));

let logMealPrefetch: ReturnType<typeof loadLogMealPage> | null = null;

export function prefetchLogMealPage(): void {
  if (!logMealPrefetch) {
    logMealPrefetch = loadLogMealPage();
  }
}
