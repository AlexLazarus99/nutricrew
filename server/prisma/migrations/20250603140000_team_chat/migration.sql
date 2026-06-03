CREATE TABLE IF NOT EXISTS "chat_messages" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "team_id" UUID NOT NULL,
  "user_id" BIGINT,
  "author_name" VARCHAR(128) NOT NULL,
  "body" VARCHAR(500) NOT NULL,
  "is_hidden" BOOLEAN NOT NULL DEFAULT false,
  "hidden_reason" VARCHAR(64),
  "is_system" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "chat_messages_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "chat_messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "chat_messages_team_id_created_at_idx" ON "chat_messages"("team_id", "created_at");

CREATE TABLE IF NOT EXISTS "chat_reactions" (
  "message_id" UUID NOT NULL,
  "user_id" BIGINT NOT NULL,
  "emoji" VARCHAR(16) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "chat_reactions_pkey" PRIMARY KEY ("message_id", "user_id", "emoji"),
  CONSTRAINT "chat_reactions_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "chat_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "chat_reactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
