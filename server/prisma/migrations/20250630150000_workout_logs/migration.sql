CREATE TABLE IF NOT EXISTS "workout_logs" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id" BIGINT NOT NULL,
  "log_date" DATE NOT NULL,
  "workout_type" VARCHAR(24) NOT NULL,
  "duration_minutes" INTEGER NOT NULL,
  "distance_km" DOUBLE PRECISION,
  "steps" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "workout_logs_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "workout_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "workout_logs_user_id_log_date_idx" ON "workout_logs"("user_id", "log_date");
