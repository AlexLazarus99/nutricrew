import "dotenv/config";
import { runMigrations, disconnectDb } from "./migrate.js";
import { prisma } from "./client.js";
import * as teamsRepo from "../repositories/teams.js";
import * as prizesRepo from "../repositories/prizes.js";

export async function seedIfEmpty(): Promise<void> {
  const count = await prisma.team.count();
  if (count > 0) return;

  const demo = await teamsRepo.createTeam("Protein Squad");
  const demo2 = await teamsRepo.createTeam("Veggie Vikings");

  const weekKey = (await import("../lib/week.js")).getCurrentWeekKey();
  await teamsRepo.addWeeklyPoints(demo.id, weekKey, 340);
  await teamsRepo.addWeeklyPoints(demo2.id, weekKey, 420);
  await prizesRepo.addToPool(demo.id, weekKey, 50);
  await prizesRepo.addToPool(demo2.id, weekKey, 30);

  console.log(`Seeded demo teams — /join ${demo.invite_code} or ${demo2.invite_code}`);
}

async function main(): Promise<void> {
  await runMigrations();
  await seedIfEmpty();
  await disconnectDb();
}

const isMain = process.argv[1]?.includes("seed");
if (isMain) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
