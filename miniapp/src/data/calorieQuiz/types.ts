import type { MacroProfile, NutritionSource } from "./nutrition";

export type FoodUnit = "g" | "ml";

export type FoodCategory =
  | "fastfood"
  | "sweets"
  | "drinks"
  | "fruits"
  | "vegetables"
  | "bakery"
  | "dairy"
  | "meat"
  | "grains"
  | "nuts";

export type FoodCatalogEntry = {
  id: string;
  category: FoodCategory;
  unit: FoodUnit;
  emoji: string;
  source: NutritionSource;
  macros: MacroProfile;
};

export type FoodItem = FoodCatalogEntry & {
  calories: number;
};

export const FOOD_CATEGORIES: FoodCategory[] = [
  "fastfood",
  "sweets",
  "drinks",
  "fruits",
  "vegetables",
  "bakery",
  "dairy",
  "meat",
  "grains",
  "nuts",
];
