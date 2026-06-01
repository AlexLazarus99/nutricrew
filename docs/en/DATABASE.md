# NutriCrew — Database Schema

**Engine:** PostgreSQL 16 · **ORM:** Prisma · **Schema file:** `server/prisma/schema.prisma`

---

## 1. Entity-relationship diagram

```mermaid
erDiagram
  teams ||--o{ users : "current team"
  teams ||--o{ team_members : has
  users ||--o{ team_members : belongs
  users ||--o{ meals : logs
  teams ||--o{ meals : receives
  teams ||--o{ weekly_team_scores : scores
  teams ||--o{ prize_pools : funds
  users ||--o{ payments : pays
  users ||--o{ prize_awards : wins
  users ||--o{ star_transactions : ledger

  teams {
    uuid id PK
    text name
    varchar invite_code UK
    varchar weekly_goal_type
    int weekly_goal_target
    boolean is_premium
    timestamptz premium_until
    timestamptz created_at
  }

  users {
    bigint id PK
    bigint telegram_id UK
    text first_name
    varchar locale
    int current_streak
    int star_balance
    uuid team_id FK
    date last_meal_date
  }

  meals {
    uuid id PK
    bigint user_id FK
    uuid team_id FK
    text description
    int calories
    int protein
    int points
    text photo_url
    timestamptz created_at
  }

  weekly_team_scores {
    uuid team_id PK_FK
    varchar week_key PK
    int points
  }

  prize_pools {
    uuid id PK
    uuid team_id FK
    varchar week_key UK
    int stars_total
    int stars_distributed
  }
```

---

## 2. Tables

### 2.1 `teams`

Command groups competing in weekly battles.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `UUID` | PK, default `gen_random_uuid()` | Team identifier |
| `name` | `TEXT` | NOT NULL | Display name |
| `invite_code` | `VARCHAR(12)` | UNIQUE, NOT NULL | Join code (uppercase alphanumeric) |
| `weekly_goal_type` | `VARCHAR(32)` | NOT NULL, default `'points'` | `points` \| `protein` \| `calories` |
| `weekly_goal_target` | `INT` | NOT NULL, default `1000` | Target for current goal type |
| `is_premium` | `BOOLEAN` | NOT NULL, default `false` | Premium badge active |
| `premium_until` | `TIMESTAMPTZ` | NULL | Premium expiry |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, default `now()` | Creation time |

**Business rules:**

- Invite code generated via `generateInviteCode()` (8 chars, no ambiguous chars)  
- Goal type rotates every Monday: `points` → `protein` → `calories`  
- Default targets after rotation: 1000 pts / 500 g / 12000 kcal  

---

### 2.2 `users`

Telegram users; one row per `telegram_id`.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `BIGSERIAL` | PK | Internal user ID |
| `telegram_id` | `BIGINT` | UNIQUE, NOT NULL | Telegram user ID |
| `first_name` | `TEXT` | NOT NULL | From Telegram profile |
| `last_name` | `TEXT` | NULL | Optional |
| `username` | `TEXT` | NULL | @username |
| `locale` | `VARCHAR(5)` | NOT NULL, default `'en'` | UI language: `en` \| `ru` |
| `current_streak` | `INT` | NOT NULL, default `0` | Consecutive days with ≥1 meal |
| `longest_streak` | `INT` | NOT NULL, default `0` | Personal best streak |
| `last_meal_date` | `DATE` | NULL | Last calendar day with a log |
| `team_id` | `UUID` | FK → `teams.id`, ON DELETE SET NULL | Current team (denormalized) |
| `star_balance` | `INT` | NOT NULL, default `0` | Telegram Stars balance (in-app) |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, default `now()` | First seen |

**Indexes:** `users_team_id_idx` on `team_id`

**Business rules:**

- Upsert on every authenticated API call (sync name/username)  
- MVP: one team per user (`team_id` set once via create/join)  
- Streak reset to 0 when `last_meal_date < yesterday` (daily cron)  

---

### 2.3 `team_members`

Many-to-many membership (supports history; MVP uses one active team).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `team_id` | `UUID` | PK (composite), FK → `teams` | Team |
| `user_id` | `BIGINT` | PK (composite), FK → `users` | User |
| `joined_at` | `TIMESTAMPTZ` | NOT NULL, default `now()` | Join timestamp |

**Business rules:**

- Row created on create/join; not deleted on leave (MVP has no leave)  

---

### 2.4 `meals`

Individual food logs.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `UUID` | PK, default `gen_random_uuid()` | Meal ID |
| `user_id` | `BIGINT` | FK → `users`, NOT NULL | Logger |
| `team_id` | `UUID` | FK → `teams`, NULL | Team at log time |
| `description` | `TEXT` | NOT NULL | Meal name (AI or manual) |
| `calories` | `INT` | NOT NULL | kcal |
| `protein` | `INT` | NOT NULL, default `0` | grams |
| `points` | `INT` | NOT NULL | Personal points earned |
| `photo_url` | `TEXT` | NULL | Public/signed URL in S3 |
| `photo_key` | `TEXT` | NULL | S3 object key |
| `ai_source` | `VARCHAR(32)` | NULL | `openai` \| `fallback` |
| `ai_confidence` | `FLOAT` | NULL | 0.0–1.0 |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, default `now()` | Log time |

**Indexes:**

- `(user_id, created_at)` — today points, streak  
- `(team_id, created_at)` — weekly aggregates, team multiplier  

**Business rules:**

- `points` = personal points (after streak multiplier)  
- Team weekly score incremented separately with team multiplier applied  
- Photo uploaded to S3 path: `meals/{user_id}/{uuid}.jpg`  

---

### 2.5 `weekly_team_scores`

Aggregated team points per ISO week.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `team_id` | `UUID` | PK (composite), FK → `teams` | Team |
| `week_key` | `VARCHAR(10)` | PK (composite) | e.g. `2026-W22` |
| `points` | `INT` | NOT NULL, default `0` | Cumulative team points |

**Business rules:**

- Upserted on each meal log (`points += teamPoints`)  
- Leaderboard ordered by `points DESC` for `week_key`  
- Row created when team joins a week (even with 0 points)  

---

### 2.6 `prize_pools`

Telegram Stars collected for weekly team prizes.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `UUID` | PK | Pool ID |
| `team_id` | `UUID` | FK → `teams`, NOT NULL | Team |
| `week_key` | `VARCHAR(10)` | NOT NULL | ISO week |
| `stars_total` | `INT` | NOT NULL, default `0` | Stars funded |
| `stars_distributed` | `INT` | NOT NULL, default `0` | Stars paid to winners |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, default `now()` | Created |

**Unique:** `(team_id, week_key)`

**Business rules:**

- Funded via completed `payments` with `payment_type = 'pool_fund'`  
- Monday cron distributes `WINNER_POOL_SHARE_PERCENT` (default 80%) to rank #1 team active members  
- `stars_distributed` incremented after payout  

---

### 2.7 `payments`

Telegram Stars invoice lifecycle.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `UUID` | PK | Payment ID |
| `user_id` | `BIGINT` | FK → `users`, NOT NULL | Payer |
| `team_id` | `UUID` | NULL | Related team |
| `payload` | `TEXT` | UNIQUE, NOT NULL | Telegram invoice payload |
| `payment_type` | `VARCHAR(32)` | NOT NULL | `pool_fund` \| `premium` |
| `stars_amount` | `INT` | NOT NULL | Stars in invoice |
| `status` | `VARCHAR(16)` | NOT NULL, default `'pending'` | `pending` \| `completed` \| `failed` |
| `telegram_payment_charge_id` | `TEXT` | NULL | From `successful_payment` |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | Invoice created |
| `completed_at` | `TIMESTAMPTZ` | NULL | Payment confirmed |

**Business rules:**

- Idempotent completion: skip if `status = 'completed'`  
- `pool_fund` → increment `prize_pools.stars_total` for current week  
- `premium` → set `teams.is_premium`, `premium_until`  

---

### 2.8 `prize_awards`

History of Stars won from weekly battles.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `UUID` | PK | Award ID |
| `user_id` | `BIGINT` | FK → `users`, NOT NULL | Winner |
| `team_id` | `UUID` | NOT NULL | Winning team |
| `week_key` | `VARCHAR(10)` | NOT NULL | Week |
| `stars_amount` | `INT` | NOT NULL | Stars credited |
| `status` | `VARCHAR(16)` | NOT NULL, default `'credited'` | `credited` |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | Award time |

**Index:** `(user_id, week_key)`

---

### 2.9 `star_transactions`

Append-only ledger for star balance changes.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `UUID` | PK | Transaction ID |
| `user_id` | `BIGINT` | FK → `users`, NOT NULL | User |
| `amount` | `INT` | NOT NULL | Positive = credit |
| `type` | `VARCHAR(32)` | NOT NULL | e.g. `prize_win` |
| `reference_id` | `TEXT` | NULL | e.g. `{weekKey}:{teamId}` |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | Timestamp |

**Index:** `user_id`

**Business rules:**

- Every `star_balance` change should have a matching row  
- `prize_win` created during weekly distribution  

---

## 3. Enumerations & conventions

### 3.1 `locale`

| Value | Meaning |
|-------|---------|
| `en` | English |
| `ru` | Russian |

### 3.2 `weekly_goal_type`

| Value | Progress source |
|-------|-----------------|
| `points` | `weekly_team_scores.points` |
| `protein` | `SUM(meals.protein)` since week start |
| `calories` | `SUM(meals.calories)` since week start |

### 3.3 `week_key`

ISO week: `YYYY-Www` (UTC), computed in `server/src/lib/week.ts`.

### 3.4 `payment_type`

| Value | Effect |
|-------|--------|
| `pool_fund` | Add Stars to `prize_pools` |
| `premium` | Activate team Premium |

### 3.5 `star_transaction.type`

| Value | Description |
|-------|-------------|
| `prize_win` | Weekly battle payout |

---

## 4. Key queries (reference)

### Today's points for user

```sql
SELECT COALESCE(SUM(points), 0)
FROM meals
WHERE user_id = $1 AND created_at::date = CURRENT_DATE;
```

### Members logged today (team multiplier)

```sql
SELECT COUNT(DISTINCT user_id)
FROM meals
WHERE team_id = $1 AND created_at::date = CURRENT_DATE;
```

### Weekly leaderboard

```sql
SELECT t.name, w.points
FROM weekly_team_scores w
JOIN teams t ON t.id = w.team_id
WHERE w.week_key = $1
ORDER BY w.points DESC
LIMIT 20;
```

---

## 5. Migrations

| Command | Purpose |
|---------|---------|
| `npx prisma migrate deploy` | Apply migrations (production / startup) |
| `npx prisma db push` | Dev sync without migration file |
| `npx prisma studio` | GUI browser |
| `npm run db:seed -w server` | Demo teams + sample pools |

**Initial migration:** `server/prisma/migrations/20250529120000_init/`

**Extensions required:** `pgcrypto` (for `gen_random_uuid()`).

---

## 6. External storage (S3)

Not stored in PostgreSQL; referenced by `meals.photo_url` / `photo_key`.

| Setting | Default (dev) |
|---------|---------------|
| Bucket | `nutricrew` |
| Key pattern | `meals/{user_id}/{uuid}.jpg` |
| Endpoint | MinIO `http://localhost:9000` |

---

## 7. Data retention (recommended)

| Data | Suggestion |
|------|------------|
| `meals` | Keep indefinitely (user history) |
| `star_transactions` | Keep for audit |
| S3 photos | 90-day lifecycle rule (future) |
| `payments` | Keep for financial audit |

---

## 8. Related documents

- [Product spec (EN)](./SPEC.md)  
- [Спецификация (RU)](../ru/SPEC.md)  
- [Схема БД (RU)](../ru/DATABASE.md)
