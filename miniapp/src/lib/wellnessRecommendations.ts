import type { BodyTypeId, DietId, ExerciseId } from "../data/wellness/catalog";

export type BmiCategory = "underweight" | "normal" | "overweight" | "obese";

export type WellnessRecommendation = {
  bmi: number;
  category: BmiCategory;
  bodyType: BodyTypeId;
  diet: DietId;
  exercise: ExerciseId;
};

export function calcBmi(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
}

export function bmiCategory(bmi: number): BmiCategory {
  if (bmi < 18.5) return "underweight";
  if (bmi < 25) return "normal";
  if (bmi < 30) return "overweight";
  return "obese";
}

/** Diet & exercise suggestions from WHO/ACSM-style BMI bands + age adjustments. */
export function recommendWellness(
  weightKg: number,
  heightCm: number,
  age: number,
): WellnessRecommendation {
  const bmi = calcBmi(weightKg, heightCm);
  const category = bmiCategory(bmi);

  let bodyType: BodyTypeId = "mesomorph";
  let diet: DietId = "balancedPlate";
  let exercise: ExerciseId = "mesoMixed";

  switch (category) {
    case "underweight":
      bodyType = "ectomorph";
      diet = "highProtein";
      exercise = age >= 55 ? "mobilityAll" : "ectoStrength";
      break;
    case "normal":
      bodyType = "mesomorph";
      diet = age >= 50 ? "mediterranean" : "balancedPlate";
      exercise = age >= 60 ? "mobilityAll" : age < 35 ? "mesoSport" : "mesoMixed";
      break;
    case "overweight":
      bodyType = "endomorph";
      diet = "dash";
      exercise = age >= 55 ? "mobilityAll" : age >= 40 ? "endoStrength" : "endoCardio";
      break;
    case "obese":
      bodyType = "endomorph";
      diet = age >= 45 ? "plantForward" : "dash";
      exercise = age >= 50 ? "mobilityAll" : "endoCardio";
      break;
  }

  if (age < 18) {
    bodyType =
      category === "underweight"
        ? "ectomorph"
        : category === "overweight" || category === "obese"
          ? "endomorph"
          : "mesomorph";
    diet = "balancedPlate";
    exercise = "mobilityAll";
  } else if (age >= 65 && exercise !== "mobilityAll") {
    exercise = category === "underweight" ? "ectoCardio" : "mobilityAll";
  }

  return {
    bmi: Math.round(bmi * 10) / 10,
    category,
    bodyType,
    diet,
    exercise,
  };
}
