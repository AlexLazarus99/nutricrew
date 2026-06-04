-- Neon SQL Editor: bird roster migration (20250629120000_bird_roster)
-- Run each block separately. Wait for "Success" before the next block.
-- Use Direct connection project (not required for DDL, but same DB as Render).
-- After all blocks: either Manual Deploy on Render (prisma migrate deploy) OR Block 5.

-- Block 1: columns
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "selected_bird_id" VARCHAR(32) NOT NULL DEFAULT 'classic';

ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "reference_id" VARCHAR(64);

-- Block 2: tables
CREATE TABLE IF NOT EXISTS "user_birds" (
    "user_id" BIGINT NOT NULL,
    "bird_id" VARCHAR(32) NOT NULL,
    "unlocked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_birds_pkey" PRIMARY KEY ("user_id", "bird_id")
);

CREATE TABLE IF NOT EXISTS "user_bird_trials" (
    "user_id" BIGINT NOT NULL,
    "trial_id" VARCHAR(64) NOT NULL,
    "level_reached" INTEGER NOT NULL,
    "completed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_bird_trials_pkey" PRIMARY KEY ("user_id", "trial_id")
);

-- Block 3: foreign keys (safe if re-run)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_birds_user_id_fkey'
  ) THEN
    ALTER TABLE "user_birds"
      ADD CONSTRAINT "user_birds_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_bird_trials_user_id_fkey'
  ) THEN
    ALTER TABLE "user_bird_trials"
      ADD CONSTRAINT "user_bird_trials_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- Block 4: unlock classic bird for all existing users
INSERT INTO "user_birds" ("user_id", "bird_id", "unlocked_at")
SELECT u."id", 'classic', CURRENT_TIMESTAMP
FROM "users" u
WHERE NOT EXISTS (
    SELECT 1 FROM "user_birds" ub
    WHERE ub."user_id" = u."id" AND ub."bird_id" = 'classic'
);

-- After Blocks 1–4: on your PC (with Neon DIRECT_URL in env) run once:
--   cd server
--   npx prisma migrate resolve --applied 20250629120000_bird_roster
-- Or skip resolve and run Render Manual Deploy — migrate deploy will see tables and mark applied.
