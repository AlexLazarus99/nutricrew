import { Router } from "express";
import { authInitData } from "../middleware/authInitData.js";
import { ensureUser } from "../middleware/ensureUser.js";
import { requireProfile } from "../middleware/requireProfile.js";
import * as growthRepo from "../../repositories/growth.js";
import {
  buildGrowthPayload,
  purchaseStreakFreeze,
  startDuelForUser,
} from "../../services/growthHub.js";
import { getCurrentWeekKey } from "../../lib/week.js";
import * as teamsRepo from "../../repositories/teams.js";
import * as usersRepo from "../../repositories/users.js";
import * as wellnessRepo from "../../repositories/wellness.js";

export const growthRouter = Router();
const authedProfile = [authInitData, ensureUser, requireProfile] as const;

growthRouter.get("/", ...authedProfile, async (req, res) => {
  const payload = await buildGrowthPayload(req.dbUser!);
  res.json(payload);
});

growthRouter.patch("/settings", ...authedProfile, async (req, res) => {
  const { dailyGoalType, dailyGoalTarget, photoPrivacy, onboardingVariant } =
    req.body as Record<string, unknown>;
  const allowedGoals = ["meals", "points", "protein", "calories", "steps"];
  const allowedPrivacy = ["team", "private", "hidden"];
  const data: Parameters<typeof growthRepo.updateUserSettings>[1] = {};
  if (typeof dailyGoalType === "string" && allowedGoals.includes(dailyGoalType)) {
    data.dailyGoalType = dailyGoalType;
  }
  if (Number.isFinite(Number(dailyGoalTarget))) {
    const raw = Math.round(Number(dailyGoalTarget));
    const cap =
      typeof dailyGoalType === "string" && dailyGoalType === "steps"
        ? 50000
        : typeof data.dailyGoalType === "string" && data.dailyGoalType === "steps"
          ? 50000
          : 500;
    data.dailyGoalTarget = Math.max(1, Math.min(cap, raw));
  }
  if (typeof photoPrivacy === "string" && allowedPrivacy.includes(photoPrivacy)) {
    data.photoPrivacy = photoPrivacy;
  }
  if (onboardingVariant === "log_first" || onboardingVariant === "team_first") {
    data.onboardingVariant = onboardingVariant;
  }
  await growthRepo.updateUserSettings(req.dbUser!.id, data);
  if (data.dailyGoalType === "steps" && data.dailyGoalTarget) {
    await wellnessRepo.setStepsGoal(req.dbUser!.id, data.dailyGoalTarget);
  }
  res.json({ ok: true, growth: await buildGrowthPayload(req.dbUser!) });
});

growthRouter.post("/streak-freeze/buy", ...authedProfile, async (req, res) => {
  const { useStars } = req.body as { useStars?: boolean };
  const result = await purchaseStreakFreeze(req.dbUser!, !!useStars);
  if (!result.ok) {
    res.status(400).json({ error: result.error });
    return;
  }
  const user = await usersRepo.findById(req.dbUser!.id);
  res.json({
    ok: true,
    streakFreezes: (await growthRepo.getUserGrowthFields(req.dbUser!.id))?.streakFreezes ?? 0,
    starBalance: user?.star_balance ?? 0,
  });
});

growthRouter.post("/streak-freeze/use", ...authedProfile, async (req, res) => {
  const user = req.dbUser!;
  const ok = await growthRepo.useStreakFreeze(user.id);
  if (!ok) {
    res.status(400).json({ error: "NO_FREEZE" });
    return;
  }
  const { yesterdayUtc } = await import("../../lib/week.js");
  const { prisma } = await import("../../db/client.js");
  await prisma.user.update({
    where: { id: BigInt(user.id) },
    data: { lastMealDate: new Date(yesterdayUtc()) },
  });
  res.json({ ok: true });
});

growthRouter.post("/double-points", ...authedProfile, async (req, res) => {
  const user = req.dbUser!;
  const weekKey = getCurrentWeekKey();
  const fields = await growthRepo.getUserGrowthFields(user.id);
  if (fields?.doublePointsWeekKey === weekKey) {
    res.status(400).json({ error: "ALREADY_USED" });
    return;
  }
  let isPremium = false;
  if (user.team_id) {
    const team = await teamsRepo.findById(user.team_id);
    isPremium = !!team?.is_premium;
  }
  if (!isPremium && user.star_balance < 25) {
    res.status(400).json({ error: "INSUFFICIENT_STARS" });
    return;
  }
  if (!isPremium) {
    const { prisma } = await import("../../db/client.js");
    await prisma.$transaction([
      prisma.user.update({
        where: { id: BigInt(user.id) },
        data: { starBalance: { decrement: 25 }, doublePointsWeekKey: weekKey },
      }),
      prisma.starTransaction.create({
        data: { userId: BigInt(user.id), amount: -25, type: "double_points" },
      }),
    ]);
  } else {
    await growthRepo.markDoublePointsWeek(user.id, weekKey);
  }
  res.json({ ok: true, weekKey });
});

growthRouter.post("/duel/start", ...authedProfile, async (req, res) => {
  const result = await startDuelForUser(req.dbUser!);
  if (!result.ok) {
    res.status(400).json({ error: result.error });
    return;
  }
  res.json(result);
});

growthRouter.post("/favorites", ...authedProfile, async (req, res) => {
  const { description, calories, protein, carbs, fat } = req.body as Record<string, unknown>;
  const row = await growthRepo.upsertFavorite(req.dbUser!.id, {
    description: String(description ?? "Meal").slice(0, 200),
    calories: Math.round(Number(calories) || 0),
    protein: Math.round(Number(protein) || 0),
    carbs: Math.round(Number(carbs) || 0),
    fat: Math.round(Number(fat) || 0),
  });
  res.json({
    id: row.id,
    description: row.description,
    calories: row.calories,
    protein: row.protein,
    carbs: row.carbs,
    fat: row.fat,
    useCount: row.useCount,
  });
});

growthRouter.post("/team/league-tag", ...authedProfile, async (req, res) => {
  const user = req.dbUser!;
  if (!user.team_id) {
    res.status(400).json({ error: "NO_TEAM" });
    return;
  }
  const role = await growthRepo.getMemberRole(user.team_id, user.id);
  if (role !== "captain") {
    res.status(403).json({ error: "NOT_CAPTAIN" });
    return;
  }
  const { tag } = req.body as { tag?: string };
  const allowed = ["friends", "gym", "office", "corp"] as const;
  const normalized: string | null =
    tag === null || tag === "" || tag === undefined
      ? null
      : allowed.includes(tag as (typeof allowed)[number])
        ? tag
        : null;
  await growthRepo.setTeamLeagueTag(user.team_id, normalized);
  res.json({ ok: true, tag: normalized });
});

growthRouter.get("/team/admin", ...authedProfile, async (req, res) => {
  const { buildTeamAdminDashboard } = await import("../../services/teamAdmin.js");
  const { trackEvents } = await import("../../services/analytics.js");
  const dashboard = await buildTeamAdminDashboard(req.dbUser!);
  if (!dashboard) {
    res.status(403).json({ error: "NOT_CAPTAIN" });
    return;
  }
  await trackEvents(req.dbUser!.id, [{ name: "team_admin_view" }]);
  res.json(dashboard);
});

growthRouter.post("/team/promote", ...authedProfile, async (req, res) => {
  const user = req.dbUser!;
  if (!user.team_id) {
    res.status(400).json({ error: "NO_TEAM" });
    return;
  }
  const myRole = await growthRepo.getMemberRole(user.team_id, user.id);
  if (myRole !== "captain") {
    res.status(403).json({ error: "NOT_CAPTAIN" });
    return;
  }
  const { memberTelegramId } = req.body as { memberTelegramId?: number };
  const member = await usersRepo.findByTelegramId(Number(memberTelegramId));
  if (!member?.team_id || member.team_id !== user.team_id) {
    res.status(404).json({ error: "MEMBER_NOT_FOUND" });
    return;
  }
  await growthRepo.setMemberRole(user.team_id, member.id, "captain");
  await growthRepo.setMemberRole(user.team_id, user.id, "member");
  res.json({ ok: true });
});
