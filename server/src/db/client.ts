import { PrismaClient } from "@prisma/client";
import { normalizeDatabaseUrl, runtimeDatabaseUrl } from "./connection.js";

const url = runtimeDatabaseUrl() || normalizeDatabaseUrl(process.env.DATABASE_URL ?? "");

export const prisma = new PrismaClient({
  log: process.env.PRISMA_LOG === "true" ? ["query", "error", "warn"] : ["error"],
  ...(url ? { datasources: { db: { url } } } : {}),
});
