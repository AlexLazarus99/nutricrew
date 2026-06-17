import { Router } from "express";
import { authInitData } from "../middleware/authInitData.js";
import { ensureUser } from "../middleware/ensureUser.js";
import * as mealsRepo from "../../repositories/meals.js";
import * as teamsRepo from "../../repositories/teams.js";
import * as usersRepo from "../../repositories/users.js";
import * as birdGameRepo from "../../repositories/birdGame.js";
import { logMealForUser } from "../../services/meals.js";
import { transcribeMealAudio } from "../../services/mealAudioTranscription.js";
import {
  analyzeMealText,
  assertTextAnalyzeLimit,
  assertVoiceAnalyzeLimit,
  estimateBarcodeWithAi,
  getLastTextHints,
  getVoiceAnalyzeDailyLimit,
} from "../../services/mealTextAnalysis.js";
import { analyzeFoodImage, getLastVisionHints, probeVisionProviders } from "../../services/vision.js";
import { getRuCatalogSize, lookupBarcodeProduct } from "../../services/barcodeLookup.js";
import { attachNutritionInsight } from "../../services/nutritionRemarks.js";
import { createTeamForUser, joinTeam } from "../../services/teams.js";
import { notifyMealLogged } from "../../services/notifications.js";
import { streakMultiplier } from "../../services/streak.js";
import { getCurrentWeekKey } from "../../lib/week.js";
import { teamMultiplier } from "../../services/points.js";
import { isProfileComplete, validateProfile } from "../../lib/profileValidation.js";
import { requireProfile } from "../middleware/requireProfile.js";
import { config, getPublicSocialLinks } from "../../config.js";
import { buildTeamInviteUrl } from "../../lib/inviteLink.js";
import { apiReady } from "../ready.js";
import * as engagementRepo from "../../repositories/engagement.js";
import { parseInviteStartParam } from "../../services/referrals.js";
import { computeUserProgress } from "../../services/progress.js";
import { claimQuest, getQuestBoard } from "../../services/quests.js";
import { chatRouter } from "./chat.js";
import { growthRouter } from "./growth.js";
import { analyticsRouter } from "./analytics.js";
import { privacyRouter } from "./privacy.js";
import { valuationRouter } from "./valuation.js";
import * as growthRepo from "../../repositories/growth.js";
import { buildGrowthSummary } from "../../services/growthHub.js";
import { KUDOS_EMOJIS } from "../../lib/challengeDefinitions.js";

export const apiRouter = Router();
apiRouter.use("/chat", chatRouter);
apiRouter.use("/growth", growthRouter);
apiRouter.use("/analytics", analyticsRouter);
apiRouter.use("/privacy", privacyRouter);
apiRouter.use("/", valuationRouter);

const authed = [authInitData, ensureUser] as const;
const authedProfile = [...authed, requireProfile] as const;

const DB_HEALTH_CACHE_MS = 8000;
let dbHealthCache: { ok: boolean; checkedAt: number } | null = null;

/** Instant wake-up for Render cold start (no DB). */
apiRouter.get("/ping", async (req, res) => {
  const runVisionProbe = req.query.vision === "1" || req.query.vision === "true";
  const visionProbe = runVisionProbe ? await probeVisionProviders() : undefined;

  res.json({
    ok: true,
    service: "nutricrew-api",
    ready: apiReady,
    webappUrl: config.webappUrl,
    botUsername: config.botUsername || null,
    visionConfigured: Boolean(
      config.anthropicApiKey || config.openaiApiKey || config.geminiApiKey,
    ),
    claudeConfigured: Boolean(config.anthropicApiKey),
    visionProvider: config.anthropicApiKey
      ? "claude"
      : config.openaiApiKey
        ? "openai"
        : config.geminiApiKey
          ? "gemini"
          : null,
    visionModel: config.anthropicApiKey
      ? config.claudeVisionModel
      : config.openaiApiKey
        ? config.visionModel
        : config.geminiApiKey
          ? config.geminiVisionModel
          : null,
    geminiConfigured: Boolean(config.geminiApiKey),
    ruBarcodeCatalogSize: getRuCatalogSize(),
    visionLastHints: getLastVisionHints(),
    textLastHints: getLastTextHints(),
    visionProbe,
    socialLinks: getPublicSocialLinks(),
  });
});

apiRouter.use((req, res, next) => {
  if (req.path === "/ping" || req.path === "/health") {
    next();
    return;
  }
  if (!apiReady) {
    res.status(503).json({ error: "Server starting", code: "STARTING" });
    return;
  }
  next();
});

apiRouter.get("/health", async (_req, res) => {
  const now = Date.now();
  if (dbHealthCache && now - dbHealthCache.checkedAt < DB_HEALTH_CACHE_MS) {
    const db = dbHealthCache.ok;
    res.status(db ? 200 : 503).json({
      ok: db && apiReady,
      service: "nutricrew-api",
      db,
      ready: apiReady,
      webappUrl: config.webappUrl,
    });
    return;
  }

  try {
    const { prisma } = await import("../../db/client.js");
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("db health timeout")), 4000);
      }),
    ]);
    dbHealthCache = { ok: true, checkedAt: now };
    res.json({
      ok: apiReady,
      service: "nutricrew-api",
      db: true,
      ready: apiReady,
      webappUrl: config.webappUrl,
    });
  } catch {
    dbHealthCache = { ok: false, checkedAt: now };
    res.status(503).json({
      ok: false,
      service: "nutricrew-api",
      db: false,
      ready: apiReady,
      webappUrl: config.webappUrl,
    });
  }
});

apiRouter.get("/me", ...authed, async (req, res) => {
  const user = req.dbUser!;

  const [todayPoints, mealsToday, dailyBonus, progress] = await Promise.all([
    mealsRepo.getTodayPoints(user.id),
    mealsRepo.countMealsToday(user.id),
    engagementRepo.getDailyBonusStatus(user.id),
    computeUserProgress(user),
  ]);

  const mult = streakMultiplier(user.current_streak);

  let teamMultiplierValue = 1;
  let teamMemberCount = 0;
  let inviteCode: string | null = null;
  let inviteUrl: string | null = null;

  if (user.team_id) {
    const team = await teamsRepo.findById(user.team_id);
    inviteCode = team?.invite_code ?? null;
    inviteUrl = inviteCode
      ? buildTeamInviteUrl(inviteCode, user.telegram_id)
      : null;
    const [memberCount, logged] = await Promise.all([
      mealsRepo.countTeamMembers(user.team_id),
      mealsRepo.countMembersLoggedToday(user.team_id),
    ]);
    teamMemberCount = memberCount;
    teamMultiplierValue = teamMultiplier(logged, teamMemberCount);
  }

  const parsedStart = parseInviteStartParam(req.telegram!.startParam);
  const growth = await buildGrowthSummary(user, { mealsToday, todayPoints });
  const { getUserProStatus } = await import("../../services/userPro.js");
  const pro = await getUserProStatus(user.id);

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
    inviteCode,
    inviteUrl,
    botUsername: config.botUsername || null,
    startParam: req.telegram!.startParam,
    startInviteCode: parsedStart.code ?? null,
    streak: { days: user.current_streak, multiplier: mult },
    teamMultiplier: teamMultiplierValue,
    teamMemberCount,
    minTeamForPrizes: config.growth.minTeamForPrizes,
    mealsToday,
    mealsTodayTarget: 3,
    todayPoints,
    starBalance: user.star_balance,
    dailyBonus,
    timezoneOffsetMinutes: user.timezone_offset_minutes,
    progress,
    socialLinks: getPublicSocialLinks(),
    growth,
    tributeProUrl: config.tribute.proUrls[0] || null,
    tributeProUrls: config.tribute.proUrls.length ? config.tribute.proUrls : null,
    pro,
  });
});

apiRouter.get("/me/weekly-report", ...authedProfile, async (req, res) => {
  const { buildWeeklyReport } = await import("../../services/weeklyReport.js");
  const weekKey = (req.query.weekKey as string) || undefined;
  const report = await buildWeeklyReport(req.dbUser!, weekKey);
  const { trackEvents } = await import("../../services/analytics.js");
  await trackEvents(req.dbUser!.id, [{ name: "weekly_report_view" }]);
  res.json(report);
});

apiRouter.get("/quests", ...authedProfile, async (req, res) => {
  const board = await getQuestBoard(req.dbUser!);
  res.json(board);
});

apiRouter.post("/quests/:questId/claim", ...authedProfile, async (req, res) => {
  const user = req.dbUser!;
  const questId = String(req.params.questId ?? "");
  const result = await claimQuest(user, questId);
  if (!result.ok) {
    const code = result.error ?? "CLAIM_FAILED";
    const status = code === "QUEST_NOT_FOUND" ? 404 : 400;
    res.status(status).json({ error: code });
    return;
  }
  const board = await getQuestBoard(user);
  const progress = await computeUserProgress(user);
  res.json({
    ok: true,
    rewards: result.rewards,
    board,
    progress,
    starBalance: (await usersRepo.findById(user.id))?.star_balance ?? user.star_balance,
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

apiRouter.get("/meals/barcode/:code", ...authed, async (req, res) => {
  const code = String(req.params.code ?? "").replace(/\D/g, "");
  if (code.length < 8) {
    res.status(400).json({ error: "INVALID_BARCODE" });
    return;
  }

  const product = await lookupBarcodeProduct(code, req.dbUser!.locale);
  if (!product) {
    res.status(404).json({
      error: "BARCODE_NOT_FOUND",
      ruCatalogSize: getRuCatalogSize(),
    });
    return;
  }

  res.json(product);
});

apiRouter.post("/meals/analyze", ...authed, async (req, res) => {
  const { imageBase64 } = req.body as { imageBase64?: string };
  if (!imageBase64) {
    res.status(400).json({ error: "imageBase64 required" });
    return;
  }

  const analysis = await analyzeFoodImage(imageBase64, req.dbUser!.locale);
  const { trackEvents } = await import("../../services/analytics.js");
  await trackEvents(req.dbUser!.id, [
    {
      name: "meal_analyze",
      props: { kind: "image", source: analysis.source, cacheHit: !!analysis.cacheHit },
    },
  ]);
  res.json(attachNutritionInsight(analysis, req.dbUser!.locale ?? "ru"));
});

apiRouter.post("/meals/analyze-text", ...authed, async (req, res) => {
  const { text } = req.body as { text?: string };
  if (!text?.trim()) {
    res.status(400).json({ error: "TEXT_REQUIRED" });
    return;
  }

  try {
    await assertVoiceAnalyzeLimit(req.dbUser!.id);
  } catch {
    res.status(429).json({
      error: "VOICE_ANALYZE_LIMIT",
      limit: getVoiceAnalyzeDailyLimit(),
    });
    return;
  }

  const analysis = await analyzeMealText(text, req.dbUser!.locale, { source: "voice" });
  const { trackEvents } = await import("../../services/analytics.js");
  await trackEvents(req.dbUser!.id, [
    {
      name: "meal_analyze_voice",
      props: { kind: "text", source: analysis.source, confidence: analysis.confidence },
    },
  ]);
  res.json(attachNutritionInsight(analysis, req.dbUser!.locale ?? "ru"));
});

apiRouter.post("/meals/analyze-audio", ...authed, async (req, res) => {
  const { audioBase64, mimeType } = req.body as { audioBase64?: string; mimeType?: string };
  if (!audioBase64?.trim()) {
    res.status(400).json({ error: "AUDIO_REQUIRED" });
    return;
  }

  try {
    await assertVoiceAnalyzeLimit(req.dbUser!.id);
  } catch {
    res.status(429).json({
      error: "VOICE_ANALYZE_LIMIT",
      limit: getVoiceAnalyzeDailyLimit(),
    });
    return;
  }

  try {
    const transcript = await transcribeMealAudio(
      audioBase64,
      req.dbUser!.locale,
      mimeType ?? "audio/webm",
    );
    const analysis = await analyzeMealText(transcript, req.dbUser!.locale, { source: "voice" });
    const { trackEvents } = await import("../../services/analytics.js");
    await trackEvents(req.dbUser!.id, [
      {
        name: "meal_analyze_voice",
        props: { kind: "audio", source: analysis.source },
      },
    ]);
    res.json({
      ...attachNutritionInsight(analysis, req.dbUser!.locale ?? "ru"),
      transcript,
    });
  } catch (err) {
    const code = (err as Error).message;
    if (
      code === "INVALID_AUDIO" ||
      code === "AUDIO_TOO_SHORT" ||
      code === "TRANSCRIBE_NO_KEY" ||
      code === "TRANSCRIBE_FAILED"
    ) {
      res.status(400).json({ error: code });
      return;
    }
    throw err;
  }
});

apiRouter.post("/meals/barcode-estimate", ...authed, async (req, res) => {
  const { barcode, hint } = req.body as { barcode?: string; hint?: string };
  const code = String(barcode ?? "").replace(/\D/g, "");
  if (code.length < 8) {
    res.status(400).json({ error: "INVALID_BARCODE" });
    return;
  }

  try {
    await assertTextAnalyzeLimit(req.dbUser!.id);
  } catch {
    res.status(429).json({ error: "ANALYZE_LIMIT" });
    return;
  }

  const analysis = await estimateBarcodeWithAi(code, req.dbUser!.locale, hint);
  const { trackEvents } = await import("../../services/analytics.js");
  await trackEvents(req.dbUser!.id, [
    {
      name: "meal_analyze_text",
      props: { kind: "barcode_ai", barcode: code, source: analysis.source },
    },
  ]);
  res.json({
    ...attachNutritionInsight(analysis, req.dbUser!.locale ?? "ru"),
    barcode: code,
  });
});

apiRouter.post("/meals", ...authed, async (req, res) => {
  const user = req.dbUser!;
  const {
    description,
    calories,
    protein,
    carbs,
    fat,
    imageBase64,
    mealSlot,
    qualityTag,
    favoriteId,
    analysis,
  } = req.body as {
    description?: string;
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    imageBase64?: string;
    mealSlot?: string;
    qualityTag?: string;
    favoriteId?: string;
    analysis?: import("../../types.js").MealAnalysis;
  };

  let result;
  try {
    result = await logMealForUser(user, {
      description: description ?? "Meal",
      calories: Math.round(Number(calories) || 0),
      protein: Math.round(Number(protein) || 0),
      carbs: Math.round(Number(carbs) || 0),
      fat: Math.round(Number(fat) || 0),
      photoBase64: imageBase64,
      mealSlot,
      qualityTag,
      favoriteId,
      analysis,
    });
  } catch (e) {
    const code = (e as Error).message;
    if (code === "DAILY_MEAL_LIMIT") {
      res.status(429).json({ error: "DAILY_MEAL_LIMIT" });
      return;
    }
    if (
      code === "NOT_FOOD" ||
      code === "DUPLICATE_PHOTO" ||
      code === "MACRO_OUT_OF_RANGE" ||
      code === "ANALYZE_LIMIT"
    ) {
      res.status(400).json({ error: code });
      return;
    }
    throw e;
  }

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
    mealsToday: await mealsRepo.countMealsToday(user.id),
    inviteCode: user.team_id
      ? (await teamsRepo.findById(user.team_id))?.invite_code
      : null,
    inviteUrl: user.team_id
      ? buildTeamInviteUrl(
          (await teamsRepo.findById(user.team_id))!.invite_code,
          user.telegram_id,
        )
      : null,
    message: "Logged",
    birdBoostUntil: result.birdBoostUntil,
    newAchievements: result.newAchievements,
  });
});

apiRouter.get("/meals/diary", ...authed, async (req, res) => {
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
      mealSlot: m.meal_slot,
      qualityTag: m.quality_tag,
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

apiRouter.post("/prizes/pro-invoice", ...authedProfile, async (req, res) => {
  const user = req.dbUser!;
  const { getAppBot } = await import("../../services/botInstance.js");
  const link = await import("../../services/stars.js").then((m) =>
    m.createProInvoice(getAppBot(), user.id, user.locale),
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

  const { leagueTag } = req.body as { leagueTag?: string };
  const team = await createTeamForUser(user, name.trim(), leagueTag);
  res.json({ id: team.id, name: team.name, inviteCode: team.invite_code });
});

apiRouter.post("/teams/join", ...authedProfile, async (req, res) => {
  const user = req.dbUser!;
  const { code, referrerTelegramId } = req.body as {
    code?: string;
    referrerTelegramId?: number;
  };
  if (!code?.trim()) {
    res.status(400).json({ error: "code required" });
    return;
  }

  const parsedStart = parseInviteStartParam(req.telegram!.startParam);
  const refId =
    referrerTelegramId ??
    parsedStart.referrerTelegramId;

  try {
    const team = await joinTeam(user, code.trim(), refId);
    res.json({ id: team.id, name: team.name, inviteCode: team.invite_code });
  } catch {
    res.status(404).json({ error: "TEAM_NOT_FOUND" });
  }
});

apiRouter.get("/team/activity", ...authedProfile, async (req, res) => {
  const user = req.dbUser!;
  if (!user.team_id) {
    res.status(404).json({ error: "NO_TEAM" });
    return;
  }
  const rows = await growthRepo.getTeamActivityWithKudos(user.team_id, 12);
  res.json({
    items: rows.map((m) => ({
      id: m.id,
      userName: m.user.firstName,
      description: m.description,
      points: m.points,
      createdAt: m.createdAt.toISOString(),
      isYou: Number(m.user.telegramId) === user.telegram_id,
      kudosCount: m.kudosCount,
      kudos: m.kudos.map((k) => k.emoji),
      photoUrl:
        m.user.photoPrivacy === "hidden" || m.user.photoPrivacy === "private"
          ? null
          : m.photoUrl,
      qualityTag: m.qualityTag,
      mealSlot: m.mealSlot,
    })),
    kudosEmojis: KUDOS_EMOJIS,
  });
});

apiRouter.post("/meals/:mealId/kudos", ...authedProfile, async (req, res) => {
  const user = req.dbUser!;
  if (!user.team_id) {
    res.status(400).json({ error: "NO_TEAM" });
    return;
  }
  const mealId = String(req.params.mealId ?? "");
  const { emoji } = req.body as { emoji?: string };
  const allowed = KUDOS_EMOJIS as readonly string[];
  const pick = allowed.includes(emoji ?? "") ? emoji! : "🔥";
  const meal = await import("../../db/client.js").then((m) =>
    m.prisma.meal.findFirst({ where: { id: mealId, teamId: user.team_id } }),
  );
  if (!meal) {
    res.status(404).json({ error: "MEAL_NOT_FOUND" });
    return;
  }
  const result = await growthRepo.addMealKudos(mealId, user.id, pick);
  res.json({ ok: true, added: result.added, kudosCount: result.count });
});

apiRouter.post("/engagement/daily-bonus", ...authedProfile, async (req, res) => {
  const user = req.dbUser!;
  const { type } = req.body as { type?: string };
  if (type !== "game" && type !== "quiz") {
    res.status(400).json({ error: "type must be game or quiz" });
    return;
  }
  const result = await engagementRepo.claimDailyBonus(
    user.id,
    user.team_id,
    type,
    config.growth.dailyBonusPoints,
  );
  res.json(result);
});

apiRouter.patch("/me/timezone", ...authed, async (req, res) => {
  const { offsetMinutes } = req.body as { offsetMinutes?: number };
  if (!Number.isFinite(Number(offsetMinutes))) {
    res.status(400).json({ error: "offsetMinutes required" });
    return;
  }
  await usersRepo.setTimezoneOffset(req.dbUser!.id, Number(offsetMinutes));
  res.json({ ok: true, offsetMinutes: Number(offsetMinutes) });
});

apiRouter.patch("/me/locale", ...authed, async (req, res) => {
  const { locale } = req.body as { locale?: string };
  const allowed = new Set([
    "en", "ru", "fr", "es", "de", "tr", "pt", "sv", "it", "ar", "pl", "zh", "hi",
  ]);
  if (!locale || !allowed.has(locale)) {
    res.status(400).json({ error: "Unsupported locale" });
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
  const { score, level, fruits, birdId, ghostSamples } = req.body as {
    score?: number;
    level?: number;
    fruits?: number;
    birdId?: string;
    ghostSamples?: Array<{ t: number; y: number }>;
  };
  const parsedScore = Math.round(Number(score) || 0);
  const parsedLevel = Math.max(1, Math.round(Number(level) || 1));
  const parsedFruits = Math.max(0, Math.round(Number(fruits) || 0));

  const birdGameMeta = await import("../../services/birdGameMeta.js");
  const validationError = birdGameMeta.validateScore(parsedScore, parsedLevel, parsedFruits);
  if (validationError) {
    res.status(400).json({ error: validationError });
    return;
  }

  const antiCheat = await import("../../services/birdGameAntiCheat.js");
  const flights = Math.max(1, Math.round(parsedScore / 3));
  const cheat = await antiCheat.validateBirdScoreSubmit(
    req.dbUser!.id,
    parsedScore,
    flights,
    parsedFruits,
  );
  if (!cheat.ok) {
    res.status(400).json({ error: cheat.error, flags: cheat.flags });
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
    parsedLevel,
    parsedFruits,
  );

  const speciesId =
    typeof birdId === "string" && birdId.trim() ? birdId.trim() : "classic";
  const trials = await import("../../services/birdRoster.js").then((m) =>
    m.processTrialsOnScore(user.id, speciesId, parsedLevel),
  );

  await birdGameMeta.recordScoreMeta(
    user.id,
    displayName,
    parsedScore,
    speciesId,
    Array.isArray(ghostSamples) ? ghostSamples : undefined,
  );

  res.json({ ok: true, improved, trials });
});

apiRouter.get("/game/meta", ...authed, async (req, res) => {
  const meta = await import("../../services/birdGameMeta.js").then((m) =>
    m.getGameMeta(req.dbUser!.id),
  );
  res.json(meta);
});

apiRouter.post("/game/daily/claim", ...authed, async (req, res) => {
  const result = await import("../../services/birdGameMeta.js").then((m) =>
    m.claimDailyReward(req.dbUser!.id),
  );
  if (!result.ok) {
    res.status(400).json({ error: result.error });
    return;
  }
  res.json(result);
});

apiRouter.post("/game/upgrades", ...authed, async (req, res) => {
  const { kind } = req.body as { kind?: string };
  if (!kind || !["ghost", "gap", "nearMiss"].includes(kind)) {
    res.status(400).json({ error: "Invalid kind" });
    return;
  }
  const result = await import("../../services/birdGameMeta.js").then((m) =>
    m.purchaseUpgrade(req.dbUser!.id, kind as "ghost" | "gap" | "nearMiss"),
  );
  if (!result.ok) {
    res.status(400).json({ error: result.error });
    return;
  }
  res.json(result);
});

apiRouter.get("/game/duel", ...authed, async (req, res) => {
  const near = Math.round(Number(req.query.score) || 0);
  const opponent = await import("../../services/birdGameMeta.js").then((m) =>
    m.getDuelOpponent(req.dbUser!.id, near),
  );
  res.json({ opponent });
});

apiRouter.get("/game/birds", ...authed, async (req, res) => {
  const roster = await import("../../services/birdRoster.js").then((m) =>
    m.getBirdRoster(req.dbUser!.id),
  );
  res.json(roster);
});

apiRouter.post("/game/birds/select", ...authed, async (req, res) => {
  const { birdId } = req.body as { birdId?: string };
  if (!birdId?.trim()) {
    res.status(400).json({ error: "birdId required" });
    return;
  }
  const result = await import("../../services/birdRoster.js").then((m) =>
    m.selectBird(req.dbUser!.id, birdId.trim()),
  );
  if (!result.ok) {
    res.status(400).json({ error: result.error });
    return;
  }
  res.json({ ok: true, selectedBirdId: birdId.trim() });
});

apiRouter.post("/game/birds/unlock-stars", ...authed, async (req, res) => {
  const { birdId } = req.body as { birdId?: string };
  if (!birdId?.trim()) {
    res.status(400).json({ error: "birdId required" });
    return;
  }
  const result = await import("../../services/birdRoster.js").then((m) =>
    m.unlockWithStars(req.dbUser!.id, birdId.trim()),
  );
  if (!result.ok) {
    res.status(400).json({ error: result.error });
    return;
  }
  res.json({ ok: true, starBalance: result.starBalance, selectedBirdId: birdId.trim() });
});

apiRouter.post("/game/birds/unlock-xp", ...authed, async (req, res) => {
  const { birdId } = req.body as { birdId?: string };
  if (!birdId?.trim()) {
    res.status(400).json({ error: "birdId required" });
    return;
  }
  const result = await import("../../services/birdRoster.js").then((m) =>
    m.unlockWithXp(req.dbUser!.id, birdId.trim()),
  );
  if (!result.ok) {
    res.status(400).json({ error: result.error, availableXp: result.availableXp });
    return;
  }
  res.json({
    ok: true,
    availableXp: result.availableXp,
    selectedBirdId: result.selectedBirdId,
  });
});

apiRouter.post("/game/birds/invoice", ...authed, async (req, res) => {
  const { birdId } = req.body as { birdId?: string };
  if (!birdId?.trim()) {
    res.status(400).json({ error: "birdId required" });
    return;
  }
  const { getAppBot } = await import("../../services/botInstance.js");
  const result = await import("../../services/birdRoster.js").then((m) =>
    m.createBirdInvoice(getAppBot(), req.dbUser!.id, birdId.trim(), req.dbUser!.locale),
  );
  if ("error" in result) {
    res.status(400).json({ error: result.error });
    return;
  }
  res.json({ invoiceLink: result.invoiceLink });
});
