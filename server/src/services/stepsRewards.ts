import * as growthRepo from "../repositories/growth.js";
import * as wellnessRepo from "../repositories/wellness.js";
import { eligibleStepsXp } from "../lib/stepsXp.js";
import { tierFromWeeklyXp } from "../lib/leagueTiers.js";

export type StepsSyncResult = {
  steps: number;
  goalSteps: number;
  done: boolean;
  healthSource: string | null;
  lastHealthSyncAt: string | null;
  stepsXpEarnedToday: number;
  stepsXpGrantedNow: number;
};

export async function syncHealthStepsForUser(
  userId: number,
  steps: number,
  source: string,
  logDate: Date = new Date(),
): Promise<StepsSyncResult> {
  const goalSteps = await wellnessRepo.getStepsGoal(userId);
  const row = await wellnessRepo.mergeHealthSteps(userId, steps, source, logDate);
  const xp = await grantStepsXpDelta(userId, row.steps, goalSteps, row.stepsXpGranted, logDate);
  return {
    steps: row.steps,
    goalSteps,
    done: row.steps >= goalSteps,
    healthSource: row.healthSource,
    lastHealthSyncAt: row.lastHealthSyncAt?.toISOString() ?? null,
    stepsXpEarnedToday: xp.stepsXpEarnedToday,
    stepsXpGrantedNow: xp.stepsXpGrantedNow,
  };
}

export async function grantStepsXpForDay(userId: number, logDate: Date = new Date()) {
  const goalSteps = await wellnessRepo.getStepsGoal(userId);
  const steps = await wellnessRepo.getStepsTotalForDay(userId, logDate);
  const row = await wellnessRepo.getStepsDayRow(userId, logDate);
  return grantStepsXpDelta(userId, steps, goalSteps, row?.stepsXpGranted ?? 0, logDate);
}

async function grantStepsXpDelta(
  userId: number,
  totalSteps: number,
  goalSteps: number,
  alreadyGranted: number,
  logDate: Date,
) {
  const earned = eligibleStepsXp(totalSteps, goalSteps);
  const delta = Math.max(0, earned - alreadyGranted);
  if (delta > 0) {
    await wellnessRepo.setStepsXpGranted(userId, logDate, earned);
    const fields = await growthRepo.getUserGrowthFields(userId);
    const newWeeklyXp = (fields?.weeklyLeagueXp ?? 0) + delta;
    const tier = tierFromWeeklyXp(newWeeklyXp);
    await growthRepo.addLeagueXp(userId, delta, tier);
    await growthRepo.addBattlePassXp(userId, Math.max(4, Math.round(delta * 0.8)));
  }
  return { stepsXpEarnedToday: earned, stepsXpGrantedNow: delta };
}

export async function buildStepsResponse(userId: number, logDate: Date) {
  const [steps, goalSteps, history, row] = await Promise.all([
    wellnessRepo.getStepsTotalForDay(userId, logDate),
    wellnessRepo.getStepsGoal(userId),
    wellnessRepo.getStepsHistory(userId, 14),
    wellnessRepo.getStepsDayRow(userId, logDate),
  ]);
  const stepsXpEarnedToday = eligibleStepsXp(steps, goalSteps);
  return {
    steps,
    goalSteps,
    history,
    done: steps >= goalSteps,
    healthSource: row?.healthSource ?? null,
    lastHealthSyncAt: row?.lastHealthSyncAt?.toISOString() ?? null,
    stepsXpEarnedToday,
    stepsXpGrantedToday: row?.stepsXpGranted ?? 0,
    stepsPerXpUnit: 1000,
    xpPerStepUnit: 10,
    maxStepsXpToday: eligibleStepsXp(goalSteps, goalSteps),
  };
}
