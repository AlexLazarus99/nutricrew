import type { BiomeId } from "./progression";

export type RunnerWorldDef = {
  id: string;
  biome: BiomeId;
  nameKey: string;
  defaultName: string;
  accent: string;
  levels: number;
};

/** Five original worlds (9 stages each) — inspired by classic runner structure, not Ubisoft names. */
export const RUNNER_WORLDS: RunnerWorldDef[] = [
  {
    id: "stream",
    biome: "meadow",
    nameKey: "game.runnerWorlds.stream",
    defaultName: "Green Stream",
    accent: "#66BB6A",
    levels: 9,
  },
  {
    id: "canyon",
    biome: "desert",
    nameKey: "game.runnerWorlds.canyon",
    defaultName: "Sun Canyon",
    accent: "#FFA726",
    levels: 9,
  },
  {
    id: "swamp",
    biome: "jungle",
    nameKey: "game.runnerWorlds.swamp",
    defaultName: "Mist Swamp",
    accent: "#26A69A",
    levels: 9,
  },
  {
    id: "timber",
    biome: "forest",
    nameKey: "game.runnerWorlds.timber",
    defaultName: "Timber Vale",
    accent: "#43A047",
    levels: 9,
  },
  {
    id: "peaks",
    biome: "mountains",
    nameKey: "game.runnerWorlds.peaks",
    defaultName: "Cloud Peaks",
    accent: "#64B5F6",
    levels: 9,
  },
];

const STORAGE_KEY = "nutricrew_runner_progress_v1";

export type RunnerProgress = {
  unlockedWorld: number;
  /** Max unlocked stage (1–9) per world index */
  maxStage: number[];
  stars: Record<string, 1 | 2 | 3>;
};

function defaultProgress(): RunnerProgress {
  return {
    unlockedWorld: 0,
    maxStage: RUNNER_WORLDS.map(() => 1),
    stars: {},
  };
}

export function loadRunnerProgress(): RunnerProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultProgress();
    const p = JSON.parse(raw) as RunnerProgress;
    if (!Array.isArray(p.maxStage) || p.maxStage.length !== RUNNER_WORLDS.length) {
      return defaultProgress();
    }
    return { ...defaultProgress(), ...p, stars: p.stars ?? {} };
  } catch {
    return defaultProgress();
  }
}

export function saveRunnerProgress(p: RunnerProgress): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  } catch {
    /* ignore */
  }
}

export function stageKey(world: number, stage: number): string {
  return `${world}-${stage}`;
}

export function levelTargetScore(world: number, stage: number): number {
  return 140 + world * 90 + stage * 110;
}

export function isStageUnlocked(p: RunnerProgress, world: number, stage: number): boolean {
  if (stage < 1 || stage > 9 || world < 0 || world >= RUNNER_WORLDS.length) return false;
  if (world > p.unlockedWorld) return false;
  if (world < p.unlockedWorld) return true;
  return stage <= (p.maxStage[world] ?? 1);
}

export function starsForRun(score: number, target: number, fruits: number): 1 | 2 | 3 {
  if (score < target) return 1;
  if (score >= target * 1.35 || fruits >= 8) return 3;
  if (score >= target * 1.12 || fruits >= 4) return 2;
  return 1;
}

export function applyStageVictory(
  p: RunnerProgress,
  world: number,
  stage: number,
  stars: 1 | 2 | 3,
): RunnerProgress {
  const key = stageKey(world, stage);
  const prevStars = p.stars[key] ?? 0;
  const nextStars = Math.max(prevStars, stars) as 1 | 2 | 3;
  const maxStage = [...p.maxStage];
  if (stage >= (maxStage[world] ?? 1) && stage < 9) {
    maxStage[world] = stage + 1;
  }
  let unlockedWorld = p.unlockedWorld;
  if (stage === 9 && world === p.unlockedWorld && world < RUNNER_WORLDS.length - 1) {
    unlockedWorld = world + 1;
    maxStage[unlockedWorld] = Math.max(maxStage[unlockedWorld] ?? 1, 1);
  }
  return {
    unlockedWorld,
    maxStage,
    stars: { ...p.stars, [key]: nextStars },
  };
}

export function worldBiome(world: number): BiomeId {
  return RUNNER_WORLDS[world]?.biome ?? "meadow";
}

export function stageDifficulty(world: number, stage: number): number {
  return 1 + world * 0.12 + (stage - 1) * 0.08;
}
