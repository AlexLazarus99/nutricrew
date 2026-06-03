ALTER TABLE "teams" ADD COLUMN IF NOT EXISTS "league_tag" VARCHAR(32);

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "streak_freezes" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "league_tier" VARCHAR(16) NOT NULL DEFAULT 'bronze';
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "weekly_league_xp" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "daily_goal_type" VARCHAR(16) NOT NULL DEFAULT 'meals';
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "daily_goal_target" INTEGER NOT NULL DEFAULT 3;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "photo_privacy" VARCHAR(16) NOT NULL DEFAULT 'team';
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "bird_boost_until" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "double_points_week_key" VARCHAR(10);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "onboarding_variant" VARCHAR(16) NOT NULL DEFAULT 'team_first';

ALTER TABLE "team_members" ADD COLUMN IF NOT EXISTS "role" VARCHAR(16) NOT NULL DEFAULT 'member';

ALTER TABLE "meals" ADD COLUMN IF NOT EXISTS "meal_slot" VARCHAR(16);
ALTER TABLE "meals" ADD COLUMN IF NOT EXISTS "quality_tag" VARCHAR(16);
ALTER TABLE "meals" ADD COLUMN IF NOT EXISTS "kudos_count" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS "meal_kudos" (
  "meal_id" UUID NOT NULL,
  "user_id" BIGINT NOT NULL,
  "emoji" VARCHAR(8) NOT NULL DEFAULT '🔥',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "meal_kudos_pkey" PRIMARY KEY ("meal_id", "user_id"),
  CONSTRAINT "meal_kudos_meal_id_fkey" FOREIGN KEY ("meal_id") REFERENCES "meals"("id") ON DELETE CASCADE,
  CONSTRAINT "meal_kudos_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "favorite_meals" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id" BIGINT NOT NULL,
  "description" TEXT NOT NULL,
  "calories" INTEGER NOT NULL,
  "protein" INTEGER NOT NULL DEFAULT 0,
  "carbs" INTEGER NOT NULL DEFAULT 0,
  "fat" INTEGER NOT NULL DEFAULT 0,
  "use_count" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "favorite_meals_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "favorite_meals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "favorite_meals_user_id_idx" ON "favorite_meals"("user_id");

CREATE TABLE IF NOT EXISTS "team_challenge_progress" (
  "team_id" UUID NOT NULL,
  "challenge_id" VARCHAR(32) NOT NULL,
  "week_key" VARCHAR(10) NOT NULL,
  "progress" INTEGER NOT NULL DEFAULT 0,
  "target" INTEGER NOT NULL,
  "completed_at" TIMESTAMP(3),
  CONSTRAINT "team_challenge_progress_pkey" PRIMARY KEY ("team_id", "challenge_id", "week_key"),
  CONSTRAINT "team_challenge_progress_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "team_duels" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "team_id" UUID NOT NULL,
  "challenger_id" BIGINT NOT NULL,
  "opponent_id" BIGINT NOT NULL,
  "week_key" VARCHAR(10) NOT NULL,
  "challenger_points" INTEGER NOT NULL DEFAULT 0,
  "opponent_points" INTEGER NOT NULL DEFAULT 0,
  "status" VARCHAR(16) NOT NULL DEFAULT 'active',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "team_duels_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "team_duels_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE,
  CONSTRAINT "team_duels_challenger_id_fkey" FOREIGN KEY ("challenger_id") REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT "team_duels_opponent_id_fkey" FOREIGN KEY ("opponent_id") REFERENCES "users"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "team_duels_team_id_week_key_idx" ON "team_duels"("team_id", "week_key");

CREATE TABLE IF NOT EXISTS "user_achievements" (
  "user_id" BIGINT NOT NULL,
  "achievement_id" VARCHAR(32) NOT NULL,
  "unlocked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "user_achievements_pkey" PRIMARY KEY ("user_id", "achievement_id"),
  CONSTRAINT "user_achievements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "battle_pass_progress" (
  "user_id" BIGINT NOT NULL,
  "season_key" VARCHAR(10) NOT NULL,
  "tier" INTEGER NOT NULL DEFAULT 0,
  "xp" INTEGER NOT NULL DEFAULT 0,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "battle_pass_progress_pkey" PRIMARY KEY ("user_id"),
  CONSTRAINT "battle_pass_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);
