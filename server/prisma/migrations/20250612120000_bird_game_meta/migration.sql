-- Bird game meta: daily challenge, XP upgrades, ghost duel replays

CREATE TABLE IF NOT EXISTS "bird_game_daily" (
    "user_id" BIGINT NOT NULL,
    "day_key" VARCHAR(10) NOT NULL,
    "best_score" INTEGER NOT NULL DEFAULT 0,
    "claimed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "bird_game_daily_pkey" PRIMARY KEY ("user_id","day_key")
);

CREATE TABLE IF NOT EXISTS "bird_game_upgrades" (
    "user_id" BIGINT NOT NULL,
    "ghost_level" INTEGER NOT NULL DEFAULT 0,
    "gap_level" INTEGER NOT NULL DEFAULT 0,
    "near_miss_level" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "bird_game_upgrades_pkey" PRIMARY KEY ("user_id")
);

CREATE TABLE IF NOT EXISTS "bird_game_ghost_runs" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "display_name" TEXT NOT NULL,
    "bird_id" VARCHAR(32) NOT NULL,
    "score" INTEGER NOT NULL,
    "samples" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bird_game_ghost_runs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "bird_game_ghost_runs_score_idx" ON "bird_game_ghost_runs"("score" DESC);

ALTER TABLE "bird_game_daily" ADD CONSTRAINT "bird_game_daily_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bird_game_upgrades" ADD CONSTRAINT "bird_game_upgrades_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bird_game_ghost_runs" ADD CONSTRAINT "bird_game_ghost_runs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
