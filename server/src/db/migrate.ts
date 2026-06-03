import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import { prisma } from "./client.js";
import {
  migrationDatabaseUrl,
  migrationHostHint,
  releaseStuckMigrationLocks,
  withDbRetries,
} from "./connection.js";

const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const monorepoRoot = path.resolve(serverRoot, "..");

dotenv.config({ path: path.join(monorepoRoot, ".env") });
dotenv.config({ path: path.join(serverRoot, ".env") });

function shouldDisableMigrationAdvisoryLock(migrateUrl: string): boolean {
  if (process.env.PRISMA_SCHEMA_DISABLE_ADVISORY_LOCK === "true") {
    return true;
  }
  // Neon pooler + cold starts often exceed Prisma's 10s advisory lock wait.
  return migrateUrl.includes("neon.tech");
}

export async function runMigrations(): Promise<void> {
  const migrateUrl = migrationDatabaseUrl();
  if (!migrateUrl) {
    throw new Error("DATABASE_URL is not set");
  }

  console.log(`Prisma migrate via ${migrationHostHint(migrateUrl)}`);

  const env: NodeJS.ProcessEnv = {
    ...process.env,
    DATABASE_URL: migrateUrl,
  };

  if (shouldDisableMigrationAdvisoryLock(migrateUrl)) {
    env.PRISMA_SCHEMA_DISABLE_ADVISORY_LOCK = "true";
    console.log("Prisma advisory lock disabled for Neon migrations");
  }

  await withDbRetries("prisma migrate deploy", async () => {
    await releaseStuckMigrationLocks(migrateUrl);
    execSync("npx prisma migrate deploy", {
      cwd: serverRoot,
      stdio: "inherit",
      env,
    });
  });

  await withDbRetries("prisma connect", async () => {
    await prisma.$connect();
  });

  console.log("Prisma migrations applied");
}

export async function disconnectDb(): Promise<void> {
  await prisma.$disconnect();
}
