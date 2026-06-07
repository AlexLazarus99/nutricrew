-- User Pro subscription
ALTER TABLE "users" ADD COLUMN "is_pro" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN "pro_until" TIMESTAMP(3);

-- Meal anti-cheat metadata
ALTER TABLE "meals" ADD COLUMN "image_hash" VARCHAR(64);
ALTER TABLE "meals" ADD COLUMN "verification_status" VARCHAR(16) NOT NULL DEFAULT 'ok';
CREATE INDEX "meals_user_id_image_hash_idx" ON "meals"("user_id", "image_hash");

-- Analytics events
CREATE TABLE "analytics_events" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT,
    "event_name" VARCHAR(64) NOT NULL,
    "props" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "analytics_events_event_name_created_at_idx" ON "analytics_events"("event_name", "created_at");
CREATE INDEX "analytics_events_user_id_created_at_idx" ON "analytics_events"("user_id", "created_at");
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Vision API cache
CREATE TABLE "vision_cache" (
    "image_hash" VARCHAR(64) NOT NULL,
    "locale" VARCHAR(5) NOT NULL,
    "result" JSONB NOT NULL,
    "hit_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "vision_cache_pkey" PRIMARY KEY ("image_hash","locale")
);
