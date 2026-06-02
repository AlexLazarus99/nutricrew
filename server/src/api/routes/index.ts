import { Router } from "express";
import { authInitData } from "../middleware/authInitData.js";
import { ensureUser } from "../middleware/ensureUser.js";
import * as mealsRepo from "../../repositories/meals.js";
import * as teamsRepo from "../../repositories/teams.js";
import * as usersRepo from "../../repositories/users.js";
import * as birdGameRepo from "../../repositories/birdGame.js";
import { logMealForUser } from "../../services/meals.js";
import { analyzeFoodImage } from "../../services/vision.js";
import { createTeamForUser, joinTeam } from "../../services/teams.js";
import { notifyMealLogged } from "../../services/notifications.js";
import { streakMultiplier } from "../../services/streak.js";
import { getCurrentWeekKey } from "../../lib/week.js";
import { teamMultiplier } from "../../services/points.js";
import { isProfileComplete, validateProfile } from "../../lib/profileValidation.js";
import { requireProfile } from "../middleware/requireProfile.js";
import { config } from "../../config.js";

export const apiRouter = Router();

const authed = [authInitData, ensureUser] as const;
const authedProfile = [...authed, requireProfile] as const;

apiRouter.get("/health", async (_req, res) => {
  try {
    const { prisma } = await import("../../db/client.js");
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true, service: "nutricrew-api", db: true, webappUrl: config.webappUrl });
  } catch {
    res.status(503).json({ ok: false, service: "nutricrew-api", db: false, webappUrl: config.webappUrl });
  }
});

apiRouter.get("/me", ...authed, async (req, res) => {
  const user = req.dbUser!;
  const todayPoints = await mealsRepo.getTodayPoints(user.id);
  const mult = streakMultiplier(user.current_streak);

  let teamMultiplierValue = 1;
  if (user.team_id) {
    const total = await mealsRepo.countTeamMembers(user.team_id);
    const logged = await mealsRepo.countMembersLoggedToday(user.team_id);
    teamMultiplierValue = teamMultiplier(logged, total);
  }

  res.json({
    user: {
      id: user.telegram_id,
      firstName: user.first_name,
      lastName: user.last_name,
      username: user.username,
      languageCode: user.locale,
    },
    profileComplete: isProfileComplete(user),
    weightKg: user.weight_kg,
    heightCm: user.height_cm,
    age: user.age,
    teamId: user.team_id,
    inviteCode: user.team_id
      ? (await teamsRepo.findById(user.team_id))?.invite_code
      : null,
    startParam: req.telegram!.startParam,
    streak: { days: user.current_streak, multiplier: mult },
    teamMultiplier: teamMultiplierValue,
    todayPoints,
    starBalance: user.star_balance,
  });
});

apiRouter.get("/team", ...authedProfile, async (req, res) => {
  const user = req.dbUser!;
  if (!user.team_id) {
    res.status(404).json({ error: "NO_TEAM", message: "Join or create a team first" });
    return;
  }

  const team = await teamsRepo.findById(user.team_id);
  if (!team) {
    res.status(404).json({ error: "NO_TEAM" });
    return;
  }

  const weekKey = getCurrentWeekKey();
  const members = await teamsRepo.getMembers(user.team_id);
  const progress = await teamsRepo.getWeeklyProgress(user.team_id, weekKey);
  const rank = await teamsRepo.getTeamRank(user.team_id, weekKey);
  const totalTeams = await teamsRepo.countTeamsInWeek(weekKey);
  const today = new Date().toISOString().slice(0, 10);
  const fmt = (d: string | Date | null) =>
    d ? (d instanceof Date ? d.toISOString().slice(0, 10) : String(d).slice(0, 10)) : null;

  res.json({
    id: team.id,
    name: team.name,
    inviteCode: team.invite_code,
    members: members.map((m) => ({
      id: Number(m.telegram_id),
      name: m.first_name,
      points: m.week_points,
      loggedToday: fmt(m.last_meal_date) === today,
    })),
    isPremium: team.is_premium,
    weeklyGoal: {
      type: progress.type,
      target: progress.target,
      current: progress.current,
      unit: progress.unit,
    },
    rank: rank || 1,
    totalTeams: totalTeams || 1,
  });
});

apiRouter.get("/leaderboard", ...authedProfile, async (_req, res) => {
  const weekKey = getCurrentWeekKey();
  const teams = await teamsRepo.getLeaderboard(weekKey, 20);

  res.json({
    week: weekKey,
    teams: teams.map((t, i) => ({
      rank: i + 1,
      name: t.name,
      points: t.points,
    })),
  });
});

apiRouter.post("/meals/analyze", ...authedProfile, async (req, res) => {
  const { imageBase64 } = req.body as { imageBase64?: string };
  if (!imageBase64) {
    res.status(400).json({ error: "imageBase64 required" });
    return;
  }

  const analysis = await analyzeFoodImage(imageBase64);
  res.json(analysis);
});

apiRouter.post("/meals", ...authedProfile, async (req, res) => {
  const user = req.dbUser!;
  const { description, calories, protein, carbs, fat, imageBase64 } = req.body as {
    description?: string;
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    imageBase64?: string;
  };

  const result = await logMealForUser(user, {
    description: description ?? "Meal",
    calories: Math.round(Number(calories) || 0),
    protein: Math.round(Number(protein) || 0),
    carbs: Math.round(Number(carbs) || 0),
    fat: Math.round(Number(fat) || 0),
    photoBase64: imageBase64,
  });

  if (user.team_id) {
    const team = await teamsRepo.findById(user.team_id);
    if (team) {
      await notifyMealLogged(user, team.name, result.points);
    }
  }

  res.json({
    id: result.meal.id,
    description: result.meal.description,
    calories: result.meal.calories,
    protein: result.meal.protein,
    carbs: result.meal.carbs,
    fat: result.meal.fat,
    points: result.points,
    teamPoints: result.teamPoints,
    streak: result.streak,
    photoUrl: result.photoUrl,
    message: "Logged",
  });
});

apiRouter.get("/meals/diary", ...authedProfile, async (req, res) => {
  const user = req.dbUser!;
  const dayStart = req.query.dayStart as string | undefined;
  const dayEnd = req.query.dayEnd as string | undefined;

  if (!dayStart || !dayEnd) {
    res.status(400).json({ error: "dayStart and dayEnd required (ISO dates)" });
    return;
  }

  const from = new Date(dayStart);
  const to = new Date(dayEnd);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    res.status(400).json({ error: "Invalid date range" });
    return;
  }

  const meals = await mealsRepo.findMealsInRange(user.id, from, to);
  const totals = meals.reduce(
    (acc, m) => ({
      calories: acc.calories + m.calories,
      protein: acc.protein + m.protein,
      carbs: acc.carbs + m.carbs,
      fat: acc.fat + m.fat,
      count: acc.count + 1,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, count: 0 },
  );

  res.json({
    meals: meals.map((m) => ({
      id: m.id,
      description: m.description,
      calories: m.calories,
      protein: m.protein,
      carbs: m.carbs,
      fat: m.fat,
      points: m.points,
      photoUrl: m.photo_url,
      createdAt: m.created_at,
    })),
    totals,
  });
});

apiRouter.get("/prizes", ...authedProfile, async (req, res) => {
  const user = req.dbUser!;
  const summary = await import("../../services/stars.js").then((m) =>
    m.getPrizesSummary(user.id, user.team_id),
  );
  res.json(summary);
});

apiRouter.post("/prizes/fund-invoice", ...authedProfile, async (req, res) => {
  const user = req.dbUser!;
  const { stars } = req.body as { stars?: number };
  if (!user.team_id) {
    res.status(400).json({ error: "NO_TEAM" });
    return;
  }
  const { getAppBot } = await import("../../services/botInstance.js");
  const link = await import("../../services/stars.js").then((m) =>
    m.createPoolFundInvoice(
      getAppBot(),
      user.id,
      user.team_id!,
      Number(stars) || 50,
      user.locale,
    ),
  );
  res.json({ invoiceLink: link });
});

apiRouter.post("/prizes/premium-invoice", ...authedProfile, async (req, res) => {
  const user = req.dbUser!;
  if (!user.team_id) {
    res.status(400).json({ error: "NO_TEAM" });
    return;
  }
  const { getAppBot } = await import("../../services/botInstance.js");
  const link = await import("../../services/stars.js").then((m) =>
    m.createPremiumInvoice(getAppBot(), user.id, user.team_id!, user.locale),
  );
  res.json({ invoiceLink: link });
});

apiRouter.post("/teams/create", ...authedProfile, async (req, res) => {
  const user = req.dbUser!;
  const { name } = req.body as { name?: string };
  if (!name?.trim()) {
    res.status(400).json({ error: "name required" });
    return;
  }
  if (user.team_id) {
    res.status(400).json({ error: "ALREADY_IN_TEAM" });
    return;
  }

  const team = await createTeamForUser(user, name.trim());
  res.json({ id: team.id, name: team.name, inviteCode: team.invite_code });
});

apiRouter.post("/teams/join", ...authedProfile, async (req, res) => {
  const user = req.dbUser!;
  const { code } = req.body as { code?: string };
  if (!code?.trim()) {
    res.status(400).json({ error: "code required" });
    return;
  }

  try {
    const team = await joinTeam(user, code.trim());
    res.json({ id: team.id, name: team.name, inviteCode: team.invite_code });
  } catch {
    res.status(404).json({ error: "TEAM_NOT_FOUND" });
  }
});

apiRouter.patch("/me/locale", ...authed, async (req, res) => {
  const { locale } = req.body as { locale?: string };
  if (locale !== "en" && locale !== "ru") {
    res.status(400).json({ error: "locale must be en or ru" });
    return;
  }
  await usersRepo.setLocale(req.dbUser!.id, locale);
  res.json({ ok: true, locale });
});

apiRouter.patch("/me/profile", ...authed, async (req, res) => {
  const user = req.dbUser!;
  const { weightKg, heightCm, age } = req.body as {
    weightKg?: unknown;
    heightCm?: unknown;
    age?: unknown;
  };
  const weight = Number(weightKg);
  const height = Math.round(Number(heightCm));
  const ageYears = Math.round(Number(age));
  const err = validateProfile({ weightKg: weight, heightCm: height, age: ageYears });
  if (err) {
    res.status(400).json({ error: err });
    return;
  }

  const updated = await usersRepo.updateProfile(user.id, weight, height, ageYears);
  res.json({
    ok: true,
    profileComplete: isProfileComplete(updated),
    weightKg: updated.weight_kg,
    heightCm: updated.height_cm,
    age: updated.age,
  });
});

apiRouter.get("/game/leaderboard", ...authed, async (req, res) => {
  const rows = await birdGameRepo.getLeaderboard(20);
  const myId = req.dbUser!.id;
  res.json({
    entries: rows.map((r, i) => ({
      rank: i + 1,
      name: r.display_name,
      score: r.score,
      level: r.level,
      fruits: r.fruits,
      isYou: r.user_id === myId,
    })),
  });
});

apiRouter.post("/game/score", ...authed, async (req, res) => {
  const { score, level, fruits } = req.body as {
    score?: number;
    level?: number;
    fruits?: number;
  };
  const parsedScore = Math.round(Number(score) || 0);
  if (parsedScore < 0) {
    res.status(400).json({ error: "Invalid score" });
    return;
  }

  const user = req.dbUser!;
  const displayName =
    [user.first_name, user.last_name].filter(Boolean).join(" ").trim() ||
    user.username ||
    "Player";
  const improved = await birdGameRepo.upsertBestScore(
    user.id,
    displayName,
    parsedScore,
    Math.max(1, Math.round(Number(level) || 1)),
    Math.max(0, Math.round(Number(fruits) || 0)),
  );

  res.json({ ok: true, improved });
});
