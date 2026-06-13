ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "steps_goal" INTEGER NOT NULL DEFAULT 8000;

CREATE TABLE IF NOT EXISTS "daily_step_totals" (
  "user_id" BIGINT NOT NULL,
  "log_date" DATE NOT NULL,
  "steps" INTEGER NOT NULL DEFAULT 0,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "daily_step_totals_pkey" PRIMARY KEY ("user_id", "log_date"),
  CONSTRAINT "daily_step_totals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "daily_step_totals_user_id_log_date_idx" ON "daily_step_totals"("user_id", "log_date");
