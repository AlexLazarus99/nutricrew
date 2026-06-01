export type ProfileInput = {
  weightKg: number;
  heightCm: number;
  age: number;
};

export function validateProfile(input: ProfileInput): string | null {
  const { weightKg, heightCm, age } = input;
  if (!Number.isFinite(weightKg) || weightKg < 30 || weightKg > 300) {
    return "INVALID_WEIGHT";
  }
  if (!Number.isInteger(heightCm) || heightCm < 120 || heightCm > 230) {
    return "INVALID_HEIGHT";
  }
  if (!Number.isInteger(age) || age < 14 || age > 100) {
    return "INVALID_AGE";
  }
  return null;
}

export function isProfileComplete(user: {
  weight_kg: number | null;
  height_cm: number | null;
  age: number | null;
}): boolean {
  return user.weight_kg != null && user.height_cm != null && user.age != null;
}
