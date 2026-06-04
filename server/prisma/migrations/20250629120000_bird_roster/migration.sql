-- Bird roster: unlockable species, trials, Telegram Stars purchases

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "selected_bird_id" VARCHAR(32) NOT NULL DEFAULT 'classic';

ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "reference_id" VARCHAR(64);

CREATE TABLE IF NOT EXISTS "user_birds" (
    "user_id" BIGINT NOT NULL,
    "bird_id" VARCHAR(32) NOT NULL,
    "unlocked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_birds_pkey" PRIMARY KEY ("user_id","bird_id")
);

CREATE TABLE IF NOT EXISTS "user_bird_trials" (
    "user_id" BIGINT NOT NULL,
    "trial_id" VARCHAR(64) NOT NULL,
    "level_reached" INTEGER NOT NULL,
    "completed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_bird_trials_pkey" PRIMARY KEY ("user_id","trial_id")
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_birds_user_id_fkey') THEN
    ALTER TABLE "user_birds" ADD CONSTRAINT "user_birds_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_bird_trials_user_id_fkey') THEN
    ALTER TABLE "user_bird_trials" ADD CONSTRAINT "user_bird_trials_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

INSERT INTO "user_birds" ("user_id", "bird_id", "unlocked_at")
SELECT u."id", 'classic', CURRENT_TIMESTAMP
FROM "users" u
WHERE NOT EXISTS (
    SELECT 1 FROM "user_birds" ub WHERE ub."user_id" = u."id" AND ub."bird_id" = 'classic'
);
