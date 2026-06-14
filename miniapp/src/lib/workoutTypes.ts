export const WORKOUT_TYPES = ["walk", "run", "hike", "cycle", "swim", "stairs", "gym"] as const;

export type WorkoutType = (typeof WORKOUT_TYPES)[number];

export const WORKOUT_ICONS: Record<WorkoutType, string> = {
  walk: "🚶",
  run: "🏃",
  hike: "⛰️",
  cycle: "🚴",
  swim: "🏊",
  stairs: "🪜",
  gym: "💪",
};

const STEPS_PER_MINUTE: Record<WorkoutType, number> = {
  walk: 110,
  run: 175,
  hike: 125,
  cycle: 70,
  swim: 65,
  stairs: 150,
  gym: 85,
};

const STEPS_PER_KM: Partial<Record<WorkoutType, number>> = {
  run: 1300,
  hike: 1100,
  cycle: 650,
};

export const DURATION_PRESETS = [15, 20, 30, 45, 60] as const;

export function workoutSupportsDistance(type: WorkoutType) {
  return type === "run" || type === "hike" || type === "cycle";
}

export function estimateWorkoutSteps(
  type: WorkoutType,
  durationMinutes: number,
  distanceKm?: number | null,
): number {
  const mins = Math.max(1, Math.min(600, Math.round(durationMinutes)));
  let steps = mins * STEPS_PER_MINUTE[type];
  const perKm = STEPS_PER_KM[type];
  if (perKm && distanceKm != null && Number.isFinite(distanceKm) && distanceKm > 0) {
    const km = Math.min(200, distanceKm);
    steps = Math.max(steps, Math.round(km * perKm));
  }
  return Math.max(0, Math.round(steps));
}
