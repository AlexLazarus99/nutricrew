import programExerciseItems from "./programExerciseItems.json";
import type { ExerciseId, MuscleGroupId } from "./catalog";
import type { ExerciseItem } from "./exerciseRegistry";

type ProgramItems = Record<string, Record<string, ExerciseItem[]>>;

const ITEMS = programExerciseItems as ProgramItems;

export function getProgramGroupItems(
  programId: ExerciseId,
  groupId: MuscleGroupId,
): ExerciseItem[] {
  return ITEMS[programId]?.[groupId] ?? [];
}
