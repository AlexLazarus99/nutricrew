import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import { prisma } from "./client.js";

const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const monorepoRoot = path.resolve(serverRoot, "..");

dotenv.config({ path: path.join(monorepoRoot, ".env") });
dotenv.config({ path: path.join(serverRoot, ".env") });

export async function runMigrations(): Promise<void> {
  execSync("npx prisma migrate deploy", {
    cwd: serverRoot,
    stdio: "inherit",
    env: process.env,
  });
  await prisma.$connect();
  console.log("Prisma migrations applied");
}

export async function disconnectDb(): Promise<void> {
  await prisma.$disconnect();
}
