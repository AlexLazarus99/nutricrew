-- =============================================================================
-- XP spends table (after bird roster). Copy ONLY this SQL, not the file path.
-- =============================================================================

CREATE TABLE IF NOT EXISTS "user_xp_spends" (
    "user_id" BIGINT NOT NULL,
    "spend_type" VARCHAR(32) NOT NULL,
    "reference_id" VARCHAR(64) NOT NULL,
    "amount" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_xp_spends_pkey" PRIMARY KEY ("user_id", "spend_type", "reference_id")
);

DO $xp_fk$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_xp_spends_user_id_fkey'
  ) THEN
    ALTER TABLE "user_xp_spends"
      ADD CONSTRAINT "user_xp_spends_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $xp_fk$;
