CREATE TABLE "bird_game_bests" (
    "user_id" BIGINT NOT NULL,
    "score" INTEGER NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "fruits" INTEGER NOT NULL DEFAULT 0,
    "display_name" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bird_game_bests_pkey" PRIMARY KEY ("user_id")
);

CREATE INDEX "bird_game_bests_score_idx" ON "bird_game_bests"("score" DESC);

ALTER TABLE "bird_game_bests" ADD CONSTRAINT "bird_game_bests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
