# Neon + Render: ошибка P1001

`P1001: Can't reach database server` значит, что API **не может открыть TCP-соединение** с Postgres на Neon.

## Быстрый чеклист

1. **Разбудите проект Neon**  
   [console.neon.tech](https://console.neon.tech) → ваш проект → если статус *Idle/Suspended*, откройте **SQL Editor** или нажмите *Restore* / подождите 10–20 с.

2. **Скопируйте свежие строки подключения**  
   Neon → **Connection details** → PostgreSQL:
   - **Pooled connection** → переменная `DATABASE_URL` на Render
   - **Direct connection** → переменная `DIRECT_URL` на Render  

   В конце URL обязательно: `?sslmode=require` (Neon часто добавляет сам).

3. **Render → Web Service → Environment**  
   Обновите `DATABASE_URL` и `DIRECT_URL`, **Save**, затем **Manual Deploy** (или Clear build cache + redeploy).

4. **Пароль**  
   Если меняли пароль в Neon — сгенерируйте новую connection string и вставьте оба URL заново.

5. **Хост `*-pooler.*.neon.tech`**  
   - `DATABASE_URL` — **с** `-pooler` (для работы API)  
   - `DIRECT_URL` — **без** `-pooler` (для миграций Prisma)

## Пример (подставьте свои значения)

```env
DATABASE_URL=postgresql://USER:PASSWORD@ep-icy-tooth-apeh2t6p-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require
DIRECT_URL=postgresql://USER:PASSWORD@ep-icy-tooth-apeh2t6p.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require
```

## Альтернатива: Postgres на Render

В репозитории есть `render.yaml` с базой `nutricrew-db`. Можно не использовать Neon и привязать `DATABASE_URL` к Render Postgres (`fromDatabase` в Blueprint).

## Проверка после деплоя

- `GET https://nutricrew-dddi.onrender.com/api/ping` — `ok: true` (без БД)
- `GET https://nutricrew-dddi.onrender.com/api/health` — должно быть `"db": true` после успешного старта

Если `db: false` — смотрите логи Render → *nutricrew-api* → строки `Database startup failed` или `P1001`.

## Ошибка P1002 (advisory lock timeout)

```
Timed out trying to acquire a postgres advisory lock (72707369)
```

**Причина:** предыдущий деплой прервал `prisma migrate deploy`, или миграции шли через **pooler** (`-pooler` в хосте), или два деплоя одновременно.

**Сразу в Neon SQL Editor** (Direct connection, не pooler):

```sql
SELECT pg_terminate_backend(PSA.pid)
FROM pg_locks AS PL
INNER JOIN pg_stat_activity AS PSA ON PSA.pid = PL.pid
WHERE PL.locktype = 'advisory'
  AND PL.objid = 72707369;
```

**На Render → Environment:**

| Переменная | Значение |
|------------|----------|
| `DATABASE_URL` | Neon **Pooled** (`…-pooler.….neon.tech`) |
| `DIRECT_URL` | Neon **Direct** (без `-pooler`) |

Save → **Manual Deploy**.

Код сервера для Neon автоматически:
- мигрирует через `DIRECT_URL` (или direct-хост без pooler);
- снимает зависший lock перед migrate;
- отключает advisory lock (`PRISMA_SCHEMA_DISABLE_ADVISORY_LOCK`) на Neon.

## Миграция `20250629120000_bird_roster` (птицы / магазин)

Нужна для `/api/game/birds`, покупки птиц и испытаний.

### Способ A — через Render (рекомендуется)

1. Убедитесь, что в Render заданы `DATABASE_URL` (pooler) и `DIRECT_URL` (direct).
2. Закоммитьте и запушьте код с папкой  
   `server/prisma/migrations/20250629120000_bird_roster/`.
3. **Manual Deploy** сервиса API — при старте выполнится `prisma migrate deploy`.
4. В логах должно быть: `Prisma migrations applied`.
5. Проверка в Neon SQL Editor:

```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'selected_bird_id';

SELECT table_name FROM information_schema.tables
WHERE table_name IN ('user_birds', 'user_bird_trials');
```

### Способ B — вручную в Neon SQL Editor

Если deploy падает на P1002 или migrate не доезжает:

1. [console.neon.tech](https://console.neon.tech) → проект → **SQL Editor**.
2. Откройте в репозитории **`RUN_IN_NEON.sql`** (не вставляйте путь к файлу в редактор!):
   - `server/prisma/migrations/20250629120000_bird_roster/RUN_IN_NEON.sql`
   - затем `server/prisma/migrations/20250630140000_user_xp_spends/RUN_IN_NEON.sql`
3. Скопируйте **весь текст SQL** из файла → вставьте в Neon → **Run**.

**Ошибка `trailing junk after numeric literal ... 20250629120000_bird_roster`** значит, что в Neon попала **строка-путь** вида `20250629120000_bird_roster/neon_manual_run.sql`, а не SQL. Удалите её из редактора и вставьте только содержимое `RUN_IN_NEON.sql`.

4. При P1002 перед deploy выполните SQL снятия advisory lock (см. выше).
5. Сделайте **Manual Deploy** на Render (код API с bird roster должен быть задеплоен).

### Способ C — с локальной машины

```powershell
cd server
$env:DATABASE_URL = "<Neon DIRECT URL, без -pooler>"
$env:DIRECT_URL = "<тот же direct URL>"
$env:PRISMA_SCHEMA_DISABLE_ADVISORY_LOCK = "true"
npx prisma migrate deploy
```

Подставьте direct connection string из Neon (**Connection details → Direct**).
