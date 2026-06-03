ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "timezone_offset_minutes" INTEGER;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "referred_by_user_id" BIGINT;

ALTER TABLE "users"
  ADD CONSTRAINT "users_referred_by_user_id_fkey"
  FOREIGN KEY ("referred_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "user_daily_bonuses" (
  "user_id" BIGINT NOT NULL,
  "bonus_type" VARCHAR(16) NOT NULL,
  "bonus_date" DATE NOT NULL,
  CONSTRAINT "user_daily_bonuses_pkey" PRIMARY KEY ("user_id", "bonus_type", "bonus_date"),
  CONSTRAINT "user_daily_bonuses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
