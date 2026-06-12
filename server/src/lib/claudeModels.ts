/** Pinned + alias IDs that support vision and text on the Messages API. */
export const CLAUDE_MODEL_FALLBACKS = [
  "claude-sonnet-4-6",
  "claude-sonnet-4-5",
  "claude-sonnet-4-5-20250929",
] as const;

export function claudeModelsToTry(preferred: string): string[] {
  const trimmed = preferred.trim();
  return [...new Set([trimmed, ...CLAUDE_MODEL_FALLBACKS].filter(Boolean))];
}
