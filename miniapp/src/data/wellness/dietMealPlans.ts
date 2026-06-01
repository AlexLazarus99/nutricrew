import type { DietId } from "./catalog";
import { getCurrentWeekKey, getWeekVariantIndex } from "../../lib/week";

export type MealSlot = "breakfast" | "lunch" | "dinner" | "snack";
export type Weekday = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export type MealEntry = {
  dishId: string;
  kcal: number;
};

export type DayMealPlan = {
  day: Weekday;
  meals: Record<MealSlot, MealEntry>;
};

export const WEEKDAYS: Weekday[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

export const MEAL_SLOTS: MealSlot[] = ["breakfast", "lunch", "dinner", "snack"];

/** Number of distinct weekly menus before the cycle repeats. */
export const MEAL_PLAN_VARIANT_COUNT = 7;

function day(
  weekday: Weekday,
  breakfast: MealEntry,
  lunch: MealEntry,
  dinner: MealEntry,
  snack: MealEntry,
): DayMealPlan {
  return { day: weekday, meals: { breakfast, lunch, dinner, snack } };
}

const b = (dishId: string, kcal: number): MealEntry => ({ dishId, kcal });

/** Base week — 28 unique dishes per diet (no repeats within the week). */
export const DIET_WEEKLY_PLANS: Record<DietId, DayMealPlan[]> = {
  mediterranean: [
    day("mon", b("greekYogurtHoney", 320), b("grilledSalmonVeg", 520), b("wholeWheatPastaTomato", 480), b("fruitNuts", 180)),
    day("tue", b("mediterraneanOmelette", 350), b("quinoaTabbouleh", 420), b("bakedCodHerbs", 440), b("hummusPita", 200)),
    day("wed", b("overnightOatsBerries", 340), b("chickenSouvlaki", 510), b("lentilSoup", 380), b("oliveTapenadeToast", 190)),
    day("thu", b("shakshukaFeta", 360), b("capreseSalad", 400), b("seafoodOrzo", 490), b("tzatzikiCucumber", 160)),
    day("fri", b("figRicottaToast", 330), b("tunaNicoise", 450), b("ratatouilleQuinoa", 430), b("medDatesAlmonds", 170)),
    day("sat", b("spinachFrittata", 340), b("grilledHalloumiSalad", 440), b("stuffedPeppers", 420), b("labnehPitaSnack", 190)),
    day("sun", b("grilledFishQuinoa", 350), b("sardineCitrusSalad", 410), b("lemonHerbChicken", 500), b("tapenadeCrackers", 180)),
  ],
  dash: [
    day("mon", b("oatmealBanana", 300), b("grilledChickenBrownRice", 480), b("bakedSalmonAsparagus", 460), b("unsaltedNutsApple", 170)),
    day("tue", b("eggWhiteVeggieScramble", 280), b("turkeyVegetableSoup", 350), b("leanBeefSweetPotato", 500), b("lowFatYogurtBerries", 150)),
    day("wed", b("barleyBreakfastBowl", 310), b("beanBurritoBowl", 440), b("grilledFishQuinoa", 470), b("cottageCheeseMelon", 160)),
    day("thu", b("bakedAppleOats", 290), b("wholeGrainTurkeySandwich", 420), b("lentilStew", 390), b("celeryHummusSnack", 140)),
    day("fri", b("spinachEggWrap", 320), b("stirFryTofuBroccoli", 400), b("veggieBeanChili", 420), b("riceCakeAlmond", 160)),
    day("sat", b("poachedEggAvocado", 340), b("roastChickenVegetables", 460), b("wholeWheatPastaMarinara", 450), b("melonCottageSnack", 150)),
    day("sun", b("veggieEggMuffins", 290), b("turkeyMeatloafSlice", 430), b("bakedWhiteFishDill", 440), b("edamameCup", 130)),
  ],
  plantForward: [
    day("mon", b("smoothieBowl", 350), b("buddhaBowl", 480), b("chickpeaCurry", 420), b("trailMixFruit", 190)),
    day("tue", b("overnightChiaPudding", 320), b("falafelPlate", 450), b("blackBeanTacos", 440), b("appleAlmondButter", 200)),
    day("wed", b("tofuScramble", 310), b("minestrone", 380), b("tempehStirFry", 460), b("roastedChickpeas", 170)),
    day("thu", b("avocadoToast", 340), b("peanutNoodleSalad", 430), b("mushroomRisotto", 470), b("dateNutBalls", 180)),
    day("fri", b("greenSmoothieMango", 330), b("lentilBolognese", 450), b("stuffedSweetPotato", 410), b("frozenGrapeSnack", 120)),
    day("sat", b("buckwheatPorridge", 300), b("sobaEdamameBowl", 440), b("roastedCauliflowerPlate", 400), b("coconutOvernightOats", 180)),
    day("sun", b("berryChiaParfait", 320), b("jackfruitTacoBowl", 460), b("veggieThaiCurry", 430), b("sweetPotatoBlackBean", 200)),
  ],
  highProtein: [
    day("mon", b("proteinPancakes", 380), b("grilledChickenBreastRice", 520), b("salmonBowl", 540), b("cottageCheeseBerries", 180)),
    day("tue", b("eggWhiteOmeletteCheese", 320), b("turkeyMeatballsZucchini", 480), b("leanSteakSalad", 510), b("proteinShakeBanana", 220)),
    day("wed", b("greekYogurtGranola", 360), b("tunaSaladWholeGrain", 450), b("beefStirFry", 530), b("jerkyApple", 170)),
    day("thu", b("turkeyBaconScramble", 340), b("shrimpQuinoa", 470), b("turkeyChili", 490), b("hardBoiledEggSnack", 140)),
    day("fri", b("cottageCheeseToast", 310), b("bisonSweetPotato", 510), b("codSweetPotato", 480), b("deliTurkeyRoll", 160)),
    day("sat", b("proteinOvernightOats", 370), b("halibutLemon", 480), b("porkTenderloinGreenBeans", 500), b("edamameSeaSalt", 130)),
    day("sun", b("eggMuffinTurkey", 300), b("chickenQuinoaPower", 500), b("lentilPenneProtein", 520), b("crabAvocadoSalad", 200)),
  ],
  balancedPlate: [
    day("mon", b("wholeGrainCerealMilk", 310), b("chickenWrap", 460), b("fishTacos", 480), b("cheeseCrackersGrapes", 190)),
    day("tue", b("veggieEggMuffins", 290), b("turkeyVeggiePlate", 440), b("pastaPrimavera", 470), b("peanutButterToastBanana", 220)),
    day("wed", b("frenchToastGrain", 350), b("chefSalad", 420), b("riceBeansCheese", 490), b("applePeanutSnack", 180)),
    day("thu", b("yogurtParfaitGranola", 320), b("hamSandwich", 430), b("beefVeggieSkewers", 500), b("carrotHummusSnack", 150)),
    day("fri", b("smokedSalmonToast", 340), b("quinoaVeggieBowl", 450), b("pizzaWholeWheat", 520), b("popcornNutMix", 170)),
    day("sat", b("breakfastBurrito", 410), b("tunaNoodleLight", 440), b("sheetPanSalmon", 480), b("leanBeefBurrito", 220)),
    day("sun", b("eggCheeseEnglishMuffin", 330), b("chickenTeriyakiRice", 470), b("vegetableLasagnaLight", 510), b("whiteBeanArugula", 190)),
  ],
};

/** Stagger rotation so diets do not all shift on the same week. */
const DIET_WEEK_PHASE: Record<DietId, number> = {
  mediterranean: 0,
  dash: 1,
  plantForward: 2,
  highProtein: 3,
  balancedPlate: 4,
};

function assertUniqueWeek(dietId: DietId, plan: DayMealPlan[]) {
  const ids = plan.flatMap((d) => MEAL_SLOTS.map((slot) => d.meals[slot].dishId));
  const unique = new Set(ids);
  if (unique.size !== ids.length) {
    const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
    throw new Error(`Duplicate dishes in ${dietId} week: ${[...new Set(dupes)].join(", ")}`);
  }
}

for (const dietId of Object.keys(DIET_WEEKLY_PLANS) as DietId[]) {
  assertUniqueWeek(dietId, DIET_WEEKLY_PLANS[dietId]);
}

function rotateWeeklyPlan(base: DayMealPlan[], dayOffset: number): DayMealPlan[] {
  const byDay = new Map(base.map((entry) => [entry.day, entry]));
  return WEEKDAYS.map((weekday, index) => {
    const sourceDay = WEEKDAYS[(index + dayOffset) % WEEKDAYS.length];
    const source = byDay.get(sourceDay);
    if (!source) throw new Error(`Missing meal plan for ${sourceDay}`);
    return {
      day: weekday,
      meals: { ...source.meals },
    };
  });
}

const DIET_WEEKLY_PLAN_VARIANTS: Record<DietId, DayMealPlan[][]> = Object.fromEntries(
  (Object.keys(DIET_WEEKLY_PLANS) as DietId[]).map((dietId) => [
    dietId,
    Array.from({ length: MEAL_PLAN_VARIANT_COUNT }, (_, offset) =>
      rotateWeeklyPlan(DIET_WEEKLY_PLANS[dietId], offset),
    ),
  ]),
) as Record<DietId, DayMealPlan[][]>;

export function getDietWeeklyPlan(dietId: DietId, weekKey = getCurrentWeekKey()): DayMealPlan[] {
  const variants = DIET_WEEKLY_PLAN_VARIANTS[dietId];
  const index = getWeekVariantIndex(weekKey, variants.length, DIET_WEEK_PHASE[dietId]);
  return variants[index] ?? DIET_WEEKLY_PLANS[dietId];
}

export function getMealPlanVariantNumber(dietId: DietId, weekKey = getCurrentWeekKey()): number {
  const variants = DIET_WEEKLY_PLAN_VARIANTS[dietId];
  return getWeekVariantIndex(weekKey, variants.length, DIET_WEEK_PHASE[dietId]) + 1;
}

export function dailyTotalKcal(plan: DayMealPlan): number {
  return MEAL_SLOTS.reduce((sum, slot) => sum + plan.meals[slot].kcal, 0);
}
