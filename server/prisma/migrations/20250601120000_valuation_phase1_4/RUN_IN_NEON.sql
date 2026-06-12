-- =============================================================================
-- Valuation phase 1-4 — вставьте ВЕСЬ файл в Neon SQL Editor и нажмите Run.
-- Не запускайте отдельные строки! Не вставляйте путь к файлу!
-- Каждый FOREIGN KEY — полная строка ALTER TABLE ... ADD CONSTRAINT ...
-- =============================================================================

ALTER TABLE "meals" ADD COLUMN IF NOT EXISTS "fiber_g" DOUBLE PRECISION;
ALTER TABLE "meals" ADD COLUMN IF NOT EXISTS "sugar_g" DOUBLE PRECISION;
ALTER TABLE "meals" ADD COLUMN IF NOT EXISTS "sodium_mg" DOUBLE PRECISION;
ALTER TABLE "meals" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "meals" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS "meals_user_id_deleted_at_idx" ON "meals"("user_id", "deleted_at");

CREATE TABLE IF NOT EXISTS "weight_logs" ("id" UUID NOT NULL DEFAULT gen_random_uuid(), "user_id" BIGINT NOT NULL, "kg" DOUBLE PRECISION NOT NULL, "logged_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "weight_logs_pkey" PRIMARY KEY ("id"));
CREATE INDEX IF NOT EXISTS "weight_logs_user_id_logged_at_idx" ON "weight_logs"("user_id", "logged_at");
ALTER TABLE "weight_logs" DROP CONSTRAINT IF EXISTS "weight_logs_user_id_fkey";
ALTER TABLE "weight_logs" ADD CONSTRAINT "weight_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "water_logs" ("id" UUID NOT NULL DEFAULT gen_random_uuid(), "user_id" BIGINT NOT NULL, "ml" INTEGER NOT NULL, "log_date" DATE NOT NULL, "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "water_logs_pkey" PRIMARY KEY ("id"));
CREATE INDEX IF NOT EXISTS "water_logs_user_id_log_date_idx" ON "water_logs"("user_id", "log_date");
ALTER TABLE "water_logs" DROP CONSTRAINT IF EXISTS "water_logs_user_id_fkey";
ALTER TABLE "water_logs" ADD CONSTRAINT "water_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "food_search_cache" ("query_key" VARCHAR(128) NOT NULL, "locale" VARCHAR(5) NOT NULL, "results" JSONB NOT NULL, "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "expires_at" TIMESTAMP(3) NOT NULL, CONSTRAINT "food_search_cache_pkey" PRIMARY KEY ("query_key"));

CREATE TABLE IF NOT EXISTS "organizations" ("id" UUID NOT NULL DEFAULT gen_random_uuid(), "name" TEXT NOT NULL, "billing_email" VARCHAR(256), "seat_limit" INTEGER NOT NULL DEFAULT 50, "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "organizations_pkey" PRIMARY KEY ("id"));

CREATE TABLE IF NOT EXISTS "org_members" ("organization_id" UUID NOT NULL, "user_id" BIGINT NOT NULL, "role" VARCHAR(16) NOT NULL DEFAULT 'admin', "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "org_members_pkey" PRIMARY KEY ("organization_id","user_id"));
ALTER TABLE "org_members" DROP CONSTRAINT IF EXISTS "org_members_organization_id_fkey";
ALTER TABLE "org_members" ADD CONSTRAINT "org_members_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "org_members" DROP CONSTRAINT IF EXISTS "org_members_user_id_fkey";
ALTER TABLE "org_members" ADD CONSTRAINT "org_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "teams" ADD COLUMN IF NOT EXISTS "organization_id" UUID;
CREATE INDEX IF NOT EXISTS "teams_organization_id_idx" ON "teams"("organization_id");
ALTER TABLE "teams" DROP CONSTRAINT IF EXISTS "teams_organization_id_fkey";
ALTER TABLE "teams" ADD CONSTRAINT "teams_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "team_recipes" ("id" UUID NOT NULL DEFAULT gen_random_uuid(), "team_id" UUID NOT NULL, "author_id" BIGINT NOT NULL, "title" VARCHAR(128) NOT NULL, "description" VARCHAR(1000) NOT NULL, "calories" INTEGER NOT NULL DEFAULT 0, "protein" INTEGER NOT NULL DEFAULT 0, "carbs" INTEGER NOT NULL DEFAULT 0, "fat" INTEGER NOT NULL DEFAULT 0, "vote_count" INTEGER NOT NULL DEFAULT 0, "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "team_recipes_pkey" PRIMARY KEY ("id"));
CREATE INDEX IF NOT EXISTS "team_recipes_team_id_vote_count_idx" ON "team_recipes"("team_id", "vote_count" DESC);
ALTER TABLE "team_recipes" DROP CONSTRAINT IF EXISTS "team_recipes_team_id_fkey";
ALTER TABLE "team_recipes" ADD CONSTRAINT "team_recipes_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "team_recipe_votes" ("recipe_id" UUID NOT NULL, "user_id" BIGINT NOT NULL, "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "team_recipe_votes_pkey" PRIMARY KEY ("recipe_id","user_id"));
ALTER TABLE "team_recipe_votes" DROP CONSTRAINT IF EXISTS "team_recipe_votes_recipe_id_fkey";
ALTER TABLE "team_recipe_votes" ADD CONSTRAINT "team_recipe_votes_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "team_recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "team_recipe_votes" DROP CONSTRAINT IF EXISTS "team_recipe_votes_user_id_fkey";
ALTER TABLE "team_recipe_votes" ADD CONSTRAINT "team_recipe_votes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "wearable_imports" ("id" UUID NOT NULL DEFAULT gen_random_uuid(), "user_id" BIGINT NOT NULL, "source" VARCHAR(32) NOT NULL, "payload" JSONB NOT NULL, "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "wearable_imports_pkey" PRIMARY KEY ("id"));
CREATE INDEX IF NOT EXISTS "wearable_imports_user_id_created_at_idx" ON "wearable_imports"("user_id", "created_at");
ALTER TABLE "wearable_imports" DROP CONSTRAINT IF EXISTS "wearable_imports_user_id_fkey";
ALTER TABLE "wearable_imports" ADD CONSTRAINT "wearable_imports_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "web_auth_tokens" ("id" UUID NOT NULL DEFAULT gen_random_uuid(), "email" VARCHAR(256) NOT NULL, "token" VARCHAR(64) NOT NULL, "user_id" BIGINT, "expires_at" TIMESTAMP(3) NOT NULL, "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "web_auth_tokens_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX IF NOT EXISTS "web_auth_tokens_token_key" ON "web_auth_tokens"("token");
CREATE INDEX IF NOT EXISTS "web_auth_tokens_email_idx" ON "web_auth_tokens"("email");
