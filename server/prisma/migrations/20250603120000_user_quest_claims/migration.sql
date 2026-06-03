CREATE TABLE IF NOT EXISTS "user_quest_claims" (
  "user_id" BIGINT NOT NULL,
  "quest_id" VARCHAR(64) NOT NULL,
  "period_key" VARCHAR(16) NOT NULL,
  "reward_xp" INTEGER NOT NULL DEFAULT 0,
  "reward_team" INTEGER NOT NULL DEFAULT 0,
  "reward_stars" INTEGER NOT NULL DEFAULT 0,
  "claimed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "user_quest_claims_pkey" PRIMARY KEY ("user_id", "quest_id", "period_key"),
  CONSTRAINT "user_quest_claims_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "user_quest_claims_user_id_idx" ON "user_quest_claims"("user_id");
