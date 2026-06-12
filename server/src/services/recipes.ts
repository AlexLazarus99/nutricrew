import { prisma } from "../db/client.js";
import crypto from "node:crypto";

export async function createTeamRecipe(
  userId: number,
  teamId: string,
  input: { title: string; description: string; calories?: number; protein?: number; carbs?: number; fat?: number },
) {
  const member = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId: BigInt(userId) } },
  });
  if (!member) throw new Error("NOT_IN_TEAM");

  const recipe = await prisma.teamRecipe.create({
    data: {
      teamId,
      authorId: BigInt(userId),
      title: input.title.trim().slice(0, 128),
      description: input.description.trim().slice(0, 1000),
      calories: input.calories ?? 0,
      protein: input.protein ?? 0,
      carbs: input.carbs ?? 0,
      fat: input.fat ?? 0,
    },
  });
  return recipe;
}

export async function listTeamRecipes(teamId: string, limit = 20) {
  return prisma.teamRecipe.findMany({
    where: { teamId },
    orderBy: { voteCount: "desc" },
    take: limit,
  });
}

export async function voteTeamRecipe(userId: number, recipeId: string) {
  const recipe = await prisma.teamRecipe.findUnique({ where: { id: recipeId } });
  if (!recipe) throw new Error("RECIPE_NOT_FOUND");

  const member = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId: recipe.teamId, userId: BigInt(userId) } },
  });
  if (!member) throw new Error("NOT_IN_TEAM");

  try {
    await prisma.teamRecipeVote.create({
      data: { recipeId, userId: BigInt(userId) },
    });
    await prisma.teamRecipe.update({
      where: { id: recipeId },
      data: { voteCount: { increment: 1 } },
    });
  } catch {
    throw new Error("ALREADY_VOTED");
  }
  return { ok: true };
}

export async function requestWebAuthMagicLink(email: string) {
  const token = crypto.randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
  await prisma.webAuthToken.create({
    data: {
      email: email.trim().toLowerCase().slice(0, 256),
      token,
      expiresAt,
    },
  });
  return { ok: true, token, expiresAt: expiresAt.toISOString(), note: "email_stub" };
}
