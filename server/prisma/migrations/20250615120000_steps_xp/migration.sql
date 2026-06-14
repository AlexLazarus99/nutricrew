ALTER TABLE "daily_step_totals" ADD COLUMN IF NOT EXISTS "steps_xp_granted" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "daily_step_totals" ADD COLUMN IF NOT EXISTS "health_source" VARCHAR(32);
ALTER TABLE "daily_step_totals" ADD COLUMN IF NOT EXISTS "last_health_sync_at" TIMESTAMP(3);
