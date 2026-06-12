import { PIP_WORLDS, stageCount } from "./worlds";

const STORAGE_KEY = "piprun_progress_v1";

export type StageStars = 0 | 1 | 2 | 3;

export type PipProgress = {
  unlockedWorld: number;
  maxStage: number[];
  stars: Record<string, StageStars>;
  bossTokens: number;
  bonusUnlocked: boolean;
};

function defaultProgress(): PipProgress {
  return {
    unlockedWorld: 0,
    maxStage: PIP_WORLDS.map(() => 1),
    stars: {},
    bossTokens: 0,
    bonusUnlocked: false,
  };
}

export function stageKey(world: number, stage: number): string {
  return `${world}-${stage}`;
}

export function loadProgress(): PipProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultProgress();
    const p = JSON.parse(raw) as PipProgress;
    if (!Array.isArray(p.maxStage) || p.maxStage.length !== PIP_WORLDS.length) {
      return defaultProgress();
    }
    return { ...defaultProgress(), ...p, stars: p.stars ?? {} };
  } catch {
    return defaultProgress();
  }
}

export function saveProgress(p: PipProgress): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  } catch {
    /* ignore */
  }
}

export function isStageUnlocked(p: PipProgress, world: number, stage: number): boolean {
  if (world < 0 || world >= PIP_WORLDS.length || stage < 1 || stage > stageCount(world)) {
    return false;
  }
  const w = PIP_WORLDS[world]!;
  if (w.isBonus) return p.bonusUnlocked && stage <= (p.maxStage[world] ?? 1);
  if (world > p.unlockedWorld) return false;
  if (world < p.unlockedWorld) return true;
  return stage <= (p.maxStage[world] ?? 1);
}

export function starsForRun(
  score: number,
  target: number,
  motes: number,
  moteGoal: number,
): 1 | 2 | 3 {
  const allMotes = motes >= moteGoal;
  if (score < target) return 1;
  if (allMotes && score >= target * 1.2) return 3;
  if (allMotes || score >= target * 1.15) return 2;
  return 1;
}

export function applyVictory(
  p: PipProgress,
  world: number,
  stage: number,
  stars: 1 | 2 | 3,
  wasBoss: boolean,
): PipProgress {
  const key = stageKey(world, stage);
  const prev = p.stars[key] ?? 0;
  const nextStars = Math.max(prev, stars) as StageStars;
  const maxStage = [...p.maxStage];
  const total = stageCount(world);

  if (stage >= (maxStage[world] ?? 1) && stage < total) {
    maxStage[world] = stage + 1;
  }

  let unlockedWorld = p.unlockedWorld;
  let bossTokens = p.bossTokens;
  let bonusUnlocked = p.bonusUnlocked;

  if (wasBoss) {
    bossTokens += 1;
    if (world === p.unlockedWorld && world < PIP_WORLDS.length - 2) {
      unlockedWorld = world + 1;
      maxStage[unlockedWorld] = Math.max(maxStage[unlockedWorld] ?? 1, 1);
    }
    if (bossTokens >= 5) bonusUnlocked = true;
    if (bonusUnlocked && world === PIP_WORLDS.length - 2) {
      maxStage[PIP_WORLDS.length - 1] = Math.max(maxStage[PIP_WORLDS.length - 1] ?? 1, 1);
    }
  } else if (stage === total && !wasBoss && world === p.unlockedWorld && world < PIP_WORLDS.length - 1) {
    unlockedWorld = world + 1;
    maxStage[unlockedWorld] = Math.max(maxStage[unlockedWorld] ?? 1, 1);
  }

  return {
    unlockedWorld,
    maxStage,
    stars: { ...p.stars, [key]: nextStars },
    bossTokens,
    bonusUnlocked,
  };
}
