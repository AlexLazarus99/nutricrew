/**
 * Neon / Postgres URL helpers (pooler + migrations direct URL).
 */

export function normalizeDatabaseUrl(url: string): string {
  let out = url.trim();
  if (!out) return out;

  if (out.includes("neon.tech") && !out.includes("sslmode=")) {
    out += out.includes("?") ? "&" : "?";
    out += "sslmode=require";
  }

  if (out.includes("-pooler.") && out.includes("neon.tech") && !out.includes("pgbouncer=")) {
    out += "&pgbouncer=true";
  }

  return out;
}

/** Non-pooled URL for `prisma migrate deploy` when using Neon pooler host. */
export function migrationDatabaseUrl(): string {
  const direct = process.env.DIRECT_URL?.trim();
  if (direct) return normalizeDatabaseUrl(direct);

  const main = process.env.DATABASE_URL?.trim() ?? "";
  if (main.includes("-pooler.") && main.includes("neon.tech")) {
    return normalizeDatabaseUrl(main.replace("-pooler.", "."));
  }

  return normalizeDatabaseUrl(main);
}

export function migrationHostHint(url: string): string {
  try {
    return new URL(url.replace(/^postgresql:/, "https:")).hostname;
  } catch {
    return "(unknown host)";
  }
}

/** Clear Prisma migrate advisory lock left by interrupted deploys (Neon/pooler). */
export async function releaseStuckMigrationLocks(migrateUrl: string): Promise<void> {
  const { PrismaClient } = await import("@prisma/client");
  const admin = new PrismaClient({
    datasources: { db: { url: migrateUrl } },
  });
  try {
    await admin.$executeRawUnsafe(`
      SELECT pg_terminate_backend(PSA.pid)
      FROM pg_locks AS PL
      INNER JOIN pg_stat_activity AS PSA ON PSA.pid = PL.pid
      WHERE PL.locktype = 'advisory'
        AND PL.objid = 72707369
        AND PSA.pid <> pg_backend_pid()
    `);
  } catch (err) {
    console.warn("Could not release stuck migration locks:", err);
  } finally {
    await admin.$disconnect();
  }
}

export function runtimeDatabaseUrl(): string {
  return normalizeDatabaseUrl(process.env.DATABASE_URL?.trim() ?? "");
}

const RETRY_DELAYS_MS = [0, 3000, 6000, 12000, 20000];

export async function withDbRetries<T>(
  label: string,
  fn: () => Promise<T>,
): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < RETRY_DELAYS_MS.length; i++) {
    if (RETRY_DELAYS_MS[i] > 0) {
      await new Promise((r) => setTimeout(r, RETRY_DELAYS_MS[i]));
    }
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const msg = String(err);
      const retryable =
        msg.includes("P1001") ||
        msg.includes("P1002") ||
        msg.includes("advisory lock") ||
        msg.includes("Can't reach database") ||
        msg.includes("Connection timed out") ||
        msg.includes("ECONNREFUSED") ||
        msg.includes("ETIMEDOUT");
      if (!retryable || i === RETRY_DELAYS_MS.length - 1) {
        throw err;
      }
      console.warn(`${label}: DB unreachable (attempt ${i + 1}), retrying…`);
    }
  }
  throw lastErr;
}
