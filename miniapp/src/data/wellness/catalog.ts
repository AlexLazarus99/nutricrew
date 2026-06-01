export type WellnessCategory = "body" | "diet" | "exercise";

export type BodyTypeId = "ectomorph" | "mesomorph" | "endomorph";
export type DietId = "mediterranean" | "dash" | "plantForward" | "highProtein" | "balancedPlate";
export type ExerciseId =
  | "ectoStrength"
  | "ectoCardio"
  | "mesoMixed"
  | "mesoSport"
  | "endoCardio"
  | "endoStrength"
  | "mobilityAll";

/** Muscle groups used in strength/cardio/mobility programs. */
export type MuscleGroupId =
  | "chest"
  | "back"
  | "shoulders"
  | "biceps"
  | "triceps"
  | "core"
  | "quads"
  | "hamstrings"
  | "glutes"
  | "calves";

export const MUSCLE_GROUP_IDS: MuscleGroupId[] = [
  "chest",
  "back",
  "shoulders",
  "biceps",
  "triceps",
  "core",
  "quads",
  "hamstrings",
  "glutes",
  "calves",
];

export const BODY_TYPES: BodyTypeId[] = ["ectomorph", "mesomorph", "endomorph"];
export const DIETS: DietId[] = ["mediterranean", "dash", "plantForward", "highProtein", "balancedPlate"];

export const EXERCISES_BY_BODY: Record<BodyTypeId, ExerciseId[]> = {
  ectomorph: ["ectoStrength", "ectoCardio", "mobilityAll"],
  mesomorph: ["mesoMixed", "mesoSport", "mobilityAll"],
  endomorph: ["endoCardio", "endoStrength", "mobilityAll"],
};

/** Ordered muscle-group sections shown on each exercise detail page. */
export const EXERCISE_GROUP_ORDER: Record<ExerciseId, MuscleGroupId[]> = {
  ectoStrength: ["chest", "back", "shoulders", "triceps", "biceps", "quads", "hamstrings", "glutes", "calves", "core"],
  ectoCardio: ["quads", "hamstrings", "glutes", "calves", "core"],
  mesoMixed: ["chest", "back", "shoulders", "triceps", "biceps", "quads", "hamstrings", "glutes", "calves", "core"],
  mesoSport: ["quads", "hamstrings", "glutes", "calves", "core", "shoulders", "back"],
  endoCardio: ["quads", "hamstrings", "glutes", "calves", "core"],
  endoStrength: ["quads", "glutes", "chest", "back", "shoulders", "core", "biceps", "triceps", "hamstrings", "calves"],
  mobilityAll: ["quads", "hamstrings", "glutes", "core", "back", "shoulders", "chest"],
};

export const DIET_RECOMMENDED_FOR: Record<DietId, BodyTypeId[]> = {
  mediterranean: ["mesomorph", "endomorph", "ectomorph"],
  dash: ["endomorph", "mesomorph"],
  plantForward: ["ectomorph", "mesomorph", "endomorph"],
  highProtein: ["ectomorph", "mesomorph"],
  balancedPlate: ["mesomorph", "endomorph", "ectomorph"],
};

export function exerciseIdsForBody(body: BodyTypeId): ExerciseId[] {
  return EXERCISES_BY_BODY[body];
}

export const BODY_TYPE_STORAGE_KEY = "nutricrew_body_type";
