# NutriCrew

Telegram bot + Mini App — social nutrition game with team battles, AI food photos, S3 storage, and Telegram Stars prizes (EN / RU).

**Documentation:** [docs/README.md](./docs/README.md) — spec, DB, pitch, **UI prototype**.  
**IP & sale:** [docs/legal/OWNERSHIP.md](./docs/legal/OWNERSHIP.md) · [acquisition pack](./docs/acquisition/README.md) — rights holder **@ingritoo**

## Stack

| Layer | Tech |
|--------|------|
| API / Bot | Node.js, Express, Telegraf |
| Database | PostgreSQL + **Prisma** migrations |
| Photos | **MinIO / S3** (AWS-compatible) |
| AI | OpenAI Vision (optional) |
| Payments | **Telegram Stars** (XTR) |
| Mini App | React + Vite + i18next |

## Quick start

### 1. Infrastructure

```bash
npm run db:up
```

Starts **PostgreSQL** (`:5432`) and **MinIO** (`:9000`, console `:9001`).

### 2. Environment

```bash
cp .env.example .env
cp miniapp/.env.example miniapp/.env
```

Set `BOT_TOKEN` from [@BotFather](https://t.me/BotFather). Enable Stars for your bot in BotFather if you use payments.

### 3. Install & migrate

```bash
npm install
cd server && npx prisma migrate deploy && cd ..
npm run dev
```

> If you used the old `schema.sql` setup, reset the DB volume (`docker compose down -v`) before Prisma migrate.

### 4. Try it

- Bot: `/create My Team` → `/join CODE` → `/stars`
- Mini App: log meal with photo → **Prizes** tab → fund pool with Stars

## Features

### Prisma

- Schema: `server/prisma/schema.prisma`
- Migrate: `npm run db:migrate -w server` or auto on server start
- Studio: `npm run db:studio -w server`

### S3 photo storage

Meal photos upload to `meals/{userId}/{uuid}.jpg`. URLs stored on `meals.photo_url`.

Disable locally: `S3_ENABLED=false` (meals still log without photo URL).

### Telegram Stars

| Flow | Description |
|------|-------------|
| **Fund pool** | Team pays Stars → weekly prize pool |
| **Weekly win** | Monday cron splits ~80% of pool among active winners |
| **Balance** | Credited to `users.star_balance` + history |
| **Premium** | Team badge for 30 days (99 ⭐ default) |

Payments use `currency: XTR` invoices via `createInvoiceLink`. Mini App opens them with `Telegram.WebApp.openInvoice`.

## API (auth: `X-Telegram-Init-Data`)

| Method | Path |
|--------|------|
| GET | `/api/prizes` |
| POST | `/api/prizes/fund-invoice` `{ stars }` |
| POST | `/api/prizes/premium-invoice` |
| POST | `/api/meals` `{ ..., imageBase64? }` |

See previous docs for `/me`, `/team`, `/leaderboard`, `/meals/analyze`.

## Cron (UTC)

| Schedule | Job |
|----------|-----|
| Mon 00:05 | Weekly results + **Stars distribution** + goal rotation |
| Daily 00:10 | Streak reset |
| Daily `REMINDER_HOUR_UTC` | Morning reminder |
| Daily 18:00 | Evening nudge |

## Project layout

```
server/
  prisma/          schema + migrations
  src/
    storage/s3.ts
    services/stars.ts, payments.ts
    repositories/  Prisma-backed
miniapp/
  src/pages/Prizes.tsx
docker-compose.yml   postgres + minio
```

## Production notes

- Use real S3 (set `S3_ENDPOINT` empty or AWS endpoint, IAM keys)
- HTTPS for `WEBAPP_URL` and webhook
- `NODE_ENV=production npm run build && npm start`
- Bot must have Stars payments enabled in BotFather
