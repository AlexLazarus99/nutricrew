import { Router } from "express";
import { authInitData } from "../middleware/authInitData.js";
import { ensureUser } from "../middleware/ensureUser.js";
import { requireProfile } from "../middleware/requireProfile.js";
import { requireAppAccess } from "../middleware/requireAppAccess.js";
import { patchMealForUser, deleteMealForUser } from "../../services/mealEdit.js";
import { buildTrends, insightText } from "../../services/trends.js";
import * as wellnessRepo from "../../repositories/wellness.js";
import { cachedFoodSearch } from "../../services/foodSearch.js";
import {
  coachReply,
  weeklyDigest,
  buildMealPlan,
  shoppingListFromPlan,
} from "../../services/proFeatures.js";
import {
  createOrganization,
  getOrgDashboard,
  linkTeamToOrg,
} from "../../services/organization.js";
import { createProCheckout, handleStripeWebhook } from "../../services/payments/stripeAdapter.js";
import { getReferralProgress, claimReferralTierReward } from "../../services/referralsV2.js";
import { cohortRetention } from "../../services/cohortAnalytics.js";
import {
  createTeamRecipe,
  listTeamRecipes,
  voteTeamRecipe,
  requestWebAuthMagicLink,
} from "../../services/recipes.js";
import { importWearablePayload, listWearableImports } from "../../services/wearables.js";
import { buildWeeklyReport } from "../../services/weeklyReport.js";
import { buildStepsResponse, syncHealthStepsForUser, grantStepsXpForDay } from "../../services/stepsRewards.js";
import { estimateWorkoutSteps, isWorkoutType } from "../../lib/workoutTypes.js";
import { isUserPro } from "../../services/userPro.js";
import {
  buildDeficitSummary,
  buildFourWeekMealPlan,
  exportDiaryCsv,
  getProGoals,
  getProPerks,
  plateReview,
} from "../../services/proExtras.js";

const authed = [authInitData, ensureUser] as const;
const authedAccess = [...authed, requireAppAccess] as const;
const authedProfile = [...authed, requireProfile] as const;
const authedProfileAccess = [...authedProfile, requireAppAccess] as const;

export const valuationRouter = Router();

valuationRouter.patch("/meals/:mealId", ...authedProfileAccess, async (req, res) => {
  try {
    const meal = await patchMealForUser(req.dbUser!.id, req.params.mealId!, req.body);
    res.json({ meal });
  } catch (e) {
    const msg = (e as Error).message;
    res.status(msg === "MEAL_NOT_FOUND" ? 404 : 400).json({ error: msg });
  }
});

valuationRouter.delete("/meals/:mealId", ...authedProfileAccess, async (req, res) => {
  try {
    await deleteMealForUser(req.dbUser!.id, req.params.mealId!);
    res.json({ ok: true });
  } catch (e) {
    const msg = (e as Error).message;
    res.status(msg === "MEAL_NOT_FOUND" ? 404 : 400).json({ error: msg });
  }
});

valuationRouter.get("/me/trends", ...authedProfileAccess, async (req, res) => {
  const range = (req.query.range as string) || "30d";
  let r: "7d" | "30d" | "90d" = range === "7d" || range === "90d" ? range : "30d";
  const pro = await isUserPro(req.dbUser!.id);
  if (!pro && r !== "7d") {
    r = "7d";
  }
  const trends = await buildTrends(req.dbUser!, r);
  const locale = req.dbUser!.locale ?? "en";
  res.json({
    ...trends,
    insightTexts: trends.insights.map((i) => insightText(i, locale)),
    proExtendedRange: pro,
  });
});

valuationRouter.get("/me/weight", ...authedProfileAccess, async (req, res) => {
  const logs = await wellnessRepo.getWeightLogs(req.dbUser!.id, 90);
  res.json({ logs });
});

valuationRouter.post("/me/weight", ...authedProfileAccess, async (req, res) => {
  const kg = Number((req.body as { kg?: number }).kg);
  if (!Number.isFinite(kg) || kg < 30 || kg > 300) {
    res.status(400).json({ error: "INVALID_WEIGHT" });
    return;
  }
  const log = await wellnessRepo.addWeightLog(req.dbUser!.id, kg);
  res.json({ log });
});

valuationRouter.get("/me/water", ...authedAccess, async (req, res) => {
  const day = req.query.date ? new Date(String(req.query.date)) : new Date();
  const ml = await wellnessRepo.getWaterTotalForDay(req.dbUser!.id, day);
  const history = await wellnessRepo.getWaterHistory(req.dbUser!.id, 14);
  res.json({ ml, goalMl: 2000, history });
});

valuationRouter.post("/me/water", ...authedAccess, async (req, res) => {
  const ml = Number((req.body as { ml?: number }).ml);
  if (!Number.isFinite(ml) || ml < 1 || ml > 2000) {
    res.status(400).json({ error: "INVALID_WATER" });
    return;
  }
  await wellnessRepo.addWaterMl(req.dbUser!.id, ml, new Date());
  const total = await wellnessRepo.getWaterTotalForDay(req.dbUser!.id, new Date());
  res.json({ ml: total, goalMl: 2000 });
});

valuationRouter.get("/me/steps", ...authedAccess, async (req, res) => {
  const day = req.query.date ? new Date(String(req.query.date)) : new Date();
  res.json(await buildStepsResponse(req.dbUser!.id, day));
});

valuationRouter.post("/me/steps/sync-health", ...authedAccess, async (req, res) => {
  const body = req.body as { steps?: number; source?: string; date?: string };
  const steps = Number(body.steps);
  const source = String(body.source ?? "").trim().slice(0, 32);
  const allowed = ["apple_health", "health_connect", "google_fit", "samsung_health"];
  if (!Number.isFinite(steps) || steps < 0 || steps > 200000) {
    res.status(400).json({ error: "INVALID_STEPS" });
    return;
  }
  if (!source || !allowed.includes(source)) {
    res.status(400).json({ error: "INVALID_HEALTH_SOURCE" });
    return;
  }
  const day = body.date ? new Date(body.date) : new Date();
  const result = await syncHealthStepsForUser(req.dbUser!.id, steps, source, day);
  res.json(result);
});

valuationRouter.post("/me/steps", ...authedAccess, async (req, res) => {
  const body = req.body as { steps?: number; total?: number; mode?: string };
  const day = body.mode === "set" && body.total != null ? new Date() : new Date();
  let steps: number;
  if (body.mode === "set" && Number.isFinite(Number(body.total))) {
    steps = await wellnessRepo.setStepsTotal(
      req.dbUser!.id,
      Number(body.total),
      day,
    );
  } else {
    const delta = Number(body.steps);
    if (!Number.isFinite(delta) || delta < 1 || delta > 50000) {
      res.status(400).json({ error: "INVALID_STEPS" });
      return;
    }
    steps = await wellnessRepo.addSteps(req.dbUser!.id, delta, day);
  }
  const xp = await grantStepsXpForDay(req.dbUser!.id, day);
  res.json({
    ...(await buildStepsResponse(req.dbUser!.id, day)),
    stepsXpGrantedNow: xp.stepsXpGrantedNow,
  });
});

valuationRouter.post("/me/steps/workout", ...authedAccess, async (req, res) => {
  const body = req.body as {
    type?: string;
    durationMinutes?: number;
    distanceKm?: number;
    date?: string;
  };
  const type = String(body.type ?? "").trim();
  const durationMinutes = Number(body.durationMinutes);
  const distanceKm =
    body.distanceKm != null && Number.isFinite(Number(body.distanceKm))
      ? Number(body.distanceKm)
      : undefined;

  if (!isWorkoutType(type)) {
    res.status(400).json({ error: "INVALID_WORKOUT_TYPE" });
    return;
  }
  if (!Number.isFinite(durationMinutes) || durationMinutes < 1 || durationMinutes > 600) {
    res.status(400).json({ error: "INVALID_DURATION" });
    return;
  }
  if (distanceKm != null && (distanceKm <= 0 || distanceKm > 200)) {
    res.status(400).json({ error: "INVALID_DISTANCE" });
    return;
  }

  const day = body.date ? new Date(body.date) : new Date();
  const steps = estimateWorkoutSteps(type, durationMinutes, distanceKm);
  const result = await wellnessRepo.addWorkoutLog(
    req.dbUser!.id,
    day,
    type,
    Math.round(durationMinutes),
    steps,
    distanceKm,
  );
  const xp = await grantStepsXpForDay(req.dbUser!.id, day);
  res.json({
    ...(await buildStepsResponse(req.dbUser!.id, day)),
    workout: result.workout,
    stepsXpGrantedNow: xp.stepsXpGrantedNow,
  });
});

valuationRouter.patch("/me/steps/goal", ...authedAccess, async (req, res) => {
  const goalSteps = Number((req.body as { goalSteps?: number }).goalSteps);
  if (!Number.isFinite(goalSteps) || goalSteps < 1000 || goalSteps > 50000) {
    res.status(400).json({ error: "INVALID_STEP_GOAL" });
    return;
  }
  await wellnessRepo.setStepsGoal(req.dbUser!.id, Math.round(goalSteps));
  res.json(await buildStepsResponse(req.dbUser!.id, new Date()));
});

valuationRouter.get("/meals/search", ...authedAccess, async (req, res) => {
  const q = String(req.query.q ?? "").trim();
  if (q.length < 2) {
    res.status(400).json({ error: "QUERY_TOO_SHORT" });
    return;
  }
  const results = await cachedFoodSearch(q, req.dbUser!.locale ?? "ru", 12);
  res.json({ results });
});

valuationRouter.post("/pro/coach", ...authedProfileAccess, async (req, res) => {
  try {
    const { question } = req.body as { question?: string };
    const answer = await coachReply(req.dbUser!, String(question ?? ""));
    res.json(answer);
  } catch (e) {
    res.status((e as Error).message === "PRO_REQUIRED" ? 403 : 400).json({ error: (e as Error).message });
  }
});

valuationRouter.get("/pro/weekly-digest", ...authedProfileAccess, async (req, res) => {
  try {
    const digest = await weeklyDigest(req.dbUser!);
    res.json(digest);
  } catch (e) {
    res.status((e as Error).message === "PRO_REQUIRED" ? 403 : 400).json({ error: (e as Error).message });
  }
});

valuationRouter.get("/pro/meal-plan", ...authedProfileAccess, async (req, res) => {
  try {
    res.json(await buildMealPlan(req.dbUser!));
  } catch (e) {
    res.status((e as Error).message === "PRO_REQUIRED" ? 403 : 400).json({ error: (e as Error).message });
  }
});

valuationRouter.get("/pro/shopping-list", ...authedProfileAccess, async (req, res) => {
  try {
    res.json(await shoppingListFromPlan(req.dbUser!));
  } catch (e) {
    res.status((e as Error).message === "PRO_REQUIRED" ? 403 : 400).json({ error: (e as Error).message });
  }
});

valuationRouter.get("/pro/goals", ...authedProfileAccess, async (req, res) => {
  try {
    const mode = (req.query.mode as string) || "maintain";
    const m = mode === "lose" || mode === "gain" ? mode : "maintain";
    res.json(await getProGoals(req.dbUser!, m));
  } catch (e) {
    res.status((e as Error).message === "PRO_REQUIRED" ? 403 : 400).json({ error: (e as Error).message });
  }
});

valuationRouter.get("/pro/deficit", ...authedProfileAccess, async (req, res) => {
  try {
    const range = (req.query.range as string) || "30d";
    const r = range === "7d" || range === "90d" ? range : "30d";
    res.json(await buildDeficitSummary(req.dbUser!, r));
  } catch (e) {
    res.status((e as Error).message === "PRO_REQUIRED" ? 403 : 400).json({ error: (e as Error).message });
  }
});

valuationRouter.get("/pro/meal-plan-4w", ...authedProfileAccess, async (req, res) => {
  try {
    res.json(await buildFourWeekMealPlan(req.dbUser!));
  } catch (e) {
    res.status((e as Error).message === "PRO_REQUIRED" ? 403 : 400).json({ error: (e as Error).message });
  }
});

valuationRouter.post("/pro/plate-review", ...authedProfileAccess, async (req, res) => {
  try {
    const { description } = req.body as { description?: string };
    res.json(await plateReview(req.dbUser!, String(description ?? "")));
  } catch (e) {
    res.status((e as Error).message === "PRO_REQUIRED" ? 403 : 400).json({ error: (e as Error).message });
  }
});

valuationRouter.get("/pro/perks", ...authedProfileAccess, async (req, res) => {
  try {
    res.json(await getProPerks(req.dbUser!));
  } catch (e) {
    res.status((e as Error).message === "PRO_REQUIRED" ? 403 : 400).json({ error: (e as Error).message });
  }
});

valuationRouter.post("/org", ...authedProfileAccess, async (req, res) => {
  const { name, billingEmail } = req.body as { name?: string; billingEmail?: string };
  if (!name?.trim()) {
    res.status(400).json({ error: "NAME_REQUIRED" });
    return;
  }
  const org = await createOrganization(req.dbUser!.id, name, billingEmail);
  res.json({ organization: org });
});

valuationRouter.get("/org/:orgId/dashboard", ...authedProfileAccess, async (req, res) => {
  try {
    res.json(await getOrgDashboard(req.params.orgId!, req.dbUser!.id));
  } catch (e) {
    res.status(403).json({ error: (e as Error).message });
  }
});

valuationRouter.post("/org/:orgId/teams/:teamId/link", ...authedProfileAccess, async (req, res) => {
  try {
    res.json(await linkTeamToOrg(req.params.teamId!, req.params.orgId!, req.dbUser!.id));
  } catch (e) {
    res.status(403).json({ error: (e as Error).message });
  }
});

valuationRouter.post("/payments/stripe/checkout", ...authedProfileAccess, async (req, res) => {
  const session = await createProCheckout(req.dbUser!.id, req.dbUser!.locale ?? "en");
  res.json(session);
});

valuationRouter.post("/payments/stripe/webhook", async (req, res) => {
  const sig = req.headers["stripe-signature"] as string | undefined;
  const result = await handleStripeWebhook(req.body, sig);
  res.json(result);
});

valuationRouter.get("/referrals/v2", ...authedProfileAccess, async (req, res) => {
  res.json(await getReferralProgress(req.dbUser!.id));
});

valuationRouter.post("/referrals/v2/claim", ...authedProfileAccess, async (req, res) => {
  try {
    const tier = Number((req.body as { tier?: number }).tier);
    res.json(await claimReferralTierReward(req.dbUser!.id, tier));
  } catch (e) {
    res.status(400).json({ error: (e as Error).message });
  }
});

valuationRouter.get("/analytics/cohorts", ...authedAccess, async (req, res) => {
  res.json(await cohortRetention(Number(req.query.days) || 7));
});

valuationRouter.post("/wearables/import", ...authedProfileAccess, async (req, res) => {
  try {
    if (!(await isUserPro(req.dbUser!.id))) {
      res.status(403).json({ error: "PRO_REQUIRED" });
      return;
    }
    const { source, payload } = req.body as { source?: string; payload?: unknown };
    if (!source?.trim()) {
      res.status(400).json({ error: "SOURCE_REQUIRED" });
      return;
    }
    res.json(await importWearablePayload(req.dbUser!.id, source, payload ?? {}));
  } catch (e) {
    res.status(400).json({ error: (e as Error).message });
  }
});

valuationRouter.get("/wearables/imports", ...authedProfileAccess, async (req, res) => {
  res.json({ imports: await listWearableImports(req.dbUser!.id) });
});

valuationRouter.get("/teams/:teamId/recipes", ...authedProfileAccess, async (req, res) => {
  res.json({ recipes: await listTeamRecipes(req.params.teamId!) });
});

valuationRouter.post("/teams/:teamId/recipes", ...authedProfileAccess, async (req, res) => {
  try {
    const body = req.body as {
      title?: string;
      description?: string;
      calories?: number;
      protein?: number;
    };
    const recipe = await createTeamRecipe(req.dbUser!.id, req.params.teamId!, {
      title: String(body.title ?? ""),
      description: String(body.description ?? ""),
      calories: Number(body.calories) || 0,
      protein: Number(body.protein) || 0,
    });
    res.json({ recipe });
  } catch (e) {
    res.status(400).json({ error: (e as Error).message });
  }
});

valuationRouter.post("/recipes/:recipeId/vote", ...authedProfileAccess, async (req, res) => {
  try {
    res.json(await voteTeamRecipe(req.dbUser!.id, req.params.recipeId!));
  } catch (e) {
    res.status(400).json({ error: (e as Error).message });
  }
});

valuationRouter.post("/auth/web/magic-link", async (req, res) => {
  const email = String((req.body as { email?: string }).email ?? "");
  if (!email.includes("@")) {
    res.status(400).json({ error: "INVALID_EMAIL" });
    return;
  }
  res.json(await requestWebAuthMagicLink(email));
});

valuationRouter.get("/me/weekly-report/enriched", ...authedProfileAccess, async (req, res) => {
  if (!(await isUserPro(req.dbUser!.id))) {
    res.status(403).json({ error: "PRO_REQUIRED" });
    return;
  }
  const report = await buildWeeklyReport(req.dbUser!);
  const trends = await buildTrends(req.dbUser!, "7d");
  const locale = req.dbUser!.locale ?? "en";
  res.json({
    ...report,
    insights: trends.insights.map((i) => insightText(i, locale)),
  });
});
