import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient({
  log: process.env.PRISMA_LOG === "true" ? ["query", "error", "warn"] : ["error"],
});
