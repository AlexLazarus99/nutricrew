-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- CreateTable
CREATE TABLE "teams" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "invite_code" VARCHAR(12) NOT NULL,
    "weekly_goal_type" VARCHAR(32) NOT NULL DEFAULT 'points',
    "weekly_goal_target" INTEGER NOT NULL DEFAULT 1000,
    "is_premium" BOOLEAN NOT NULL DEFAULT false,
    "premium_until" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" BIGSERIAL NOT NULL,
    "telegram_id" BIGINT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT,
    "username" TEXT,
    "locale" VARCHAR(5) NOT NULL DEFAULT 'en',
    "current_streak" INTEGER NOT NULL DEFAULT 0,
    "longest_streak" INTEGER NOT NULL DEFAULT 0,
    "last_meal_date" DATE,
    "team_id" UUID,
    "star_balance" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_members" (
    "team_id" UUID NOT NULL,
    "user_id" BIGINT NOT NULL,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "team_members_pkey" PRIMARY KEY ("team_id","user_id")
);

-- CreateTable
CREATE TABLE "meals" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" BIGINT NOT NULL,
    "team_id" UUID,
    "description" TEXT NOT NULL,
    "calories" INTEGER NOT NULL,
    "protein" INTEGER NOT NULL DEFAULT 0,
    "points" INTEGER NOT NULL,
    "photo_url" TEXT,
    "photo_key" TEXT,
    "ai_source" VARCHAR(32),
    "ai_confidence" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weekly_team_scores" (
    "team_id" UUID NOT NULL,
    "week_key" VARCHAR(10) NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "weekly_team_scores_pkey" PRIMARY KEY ("team_id","week_key")
);

-- CreateTable
CREATE TABLE "prize_pools" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "team_id" UUID NOT NULL,
    "week_key" VARCHAR(10) NOT NULL,
    "stars_total" INTEGER NOT NULL DEFAULT 0,
    "stars_distributed" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prize_pools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" BIGINT NOT NULL,
    "team_id" UUID,
    "payload" TEXT NOT NULL,
    "payment_type" VARCHAR(32) NOT NULL,
    "stars_amount" INTEGER NOT NULL,
    "status" VARCHAR(16) NOT NULL DEFAULT 'pending',
    "telegram_payment_charge_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prize_awards" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" BIGINT NOT NULL,
    "team_id" UUID NOT NULL,
    "week_key" VARCHAR(10) NOT NULL,
    "stars_amount" INTEGER NOT NULL,
    "status" VARCHAR(16) NOT NULL DEFAULT 'credited',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prize_awards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "star_transactions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" BIGINT NOT NULL,
    "amount" INTEGER NOT NULL,
    "type" VARCHAR(32) NOT NULL,
    "reference_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "star_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "teams_invite_code_key" ON "teams"("invite_code");
CREATE UNIQUE INDEX "users_telegram_id_key" ON "users"("telegram_id");
CREATE INDEX "users_team_id_idx" ON "users"("team_id");
CREATE INDEX "meals_user_id_created_at_idx" ON "meals"("user_id", "created_at");
CREATE INDEX "meals_team_id_created_at_idx" ON "meals"("team_id", "created_at");
CREATE UNIQUE INDEX "prize_pools_team_id_week_key_key" ON "prize_pools"("team_id", "week_key");
CREATE UNIQUE INDEX "payments_payload_key" ON "payments"("payload");
CREATE INDEX "prize_awards_user_id_week_key_idx" ON "prize_awards"("user_id", "week_key");
CREATE INDEX "star_transactions_user_id_idx" ON "star_transactions"("user_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "meals" ADD CONSTRAINT "meals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "meals" ADD CONSTRAINT "meals_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "weekly_team_scores" ADD CONSTRAINT "weekly_team_scores_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "prize_pools" ADD CONSTRAINT "prize_pools_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "prize_awards" ADD CONSTRAINT "prize_awards_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "star_transactions" ADD CONSTRAINT "star_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
