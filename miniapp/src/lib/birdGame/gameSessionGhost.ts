import type { GameState } from "./types";

const MAX_GHOST_MS = 10000;

export function extendGhostUntil(state: GameState, extraMs: number): number {
  const bonus = state.metaGhostBonusMs;
  const cap = state.elapsed + MAX_GHOST_MS;
  return Math.min(Math.max(state.ghostUntil, state.elapsed + extraMs + bonus), cap);
}
