# NutriCrew — Схема базы данных

**СУБД:** PostgreSQL 16 · **ORM:** Prisma · **Файл схемы:** `server/prisma/schema.prisma`

---

## 1. ER-диаграмма

```mermaid
erDiagram
  teams ||--o{ users : "текущая команда"
  teams ||--o{ team_members : содержит
  users ||--o{ team_members : участник
  users ||--o{ meals : логирует
  teams ||--o{ meals : получает
  teams ||--o{ weekly_team_scores : очки
  teams ||--o{ prize_pools : фонд
  users ||--o{ payments : платит
  users ||--o{ prize_awards : выигрывает
  users ||--o{ star_transactions : ledger

  teams {
    uuid id PK
    text name
    varchar invite_code UK
    varchar weekly_goal_type
    int weekly_goal_target
    boolean is_premium
    timestamptz premium_until
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

## 2. Таблицы

### 2.1 `teams` — команды

Группы пользователей для недельных соревнований.

| Колонка | Тип | Ограничения | Описание |
|---------|-----|-------------|----------|
| `id` | `UUID` | PK, default `gen_random_uuid()` | ID команды |
| `name` | `TEXT` | NOT NULL | Название |
| `invite_code` | `VARCHAR(12)` | UNIQUE, NOT NULL | Код приглашения |
| `weekly_goal_type` | `VARCHAR(32)` | NOT NULL, default `'points'` | `points` \| `protein` \| `calories` |
| `weekly_goal_target` | `INT` | NOT NULL, default `1000` | Цель недели |
| `is_premium` | `BOOLEAN` | NOT NULL, default `false` | Premium активен |
| `premium_until` | `TIMESTAMPTZ` | NULL | Дата окончания Premium |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | Создана |

**Бизнес-правила:**

- Код: 8 символов, без путающих букв (`generateInviteCode`)  
- Ротация цели по понедельникам: `points` → `protein` → `calories`  
- Цели по умолчанию: 1000 очк. / 500 г / 12000 ккал  

---

### 2.2 `users` — пользователи

Один ряд на `telegram_id`.

| Колонка | Тип | Ограничения | Описание |
|---------|-----|-------------|----------|
| `id` | `BIGSERIAL` | PK | Внутренний ID |
| `telegram_id` | `BIGINT` | UNIQUE, NOT NULL | ID в Telegram |
| `first_name` | `TEXT` | NOT NULL | Имя |
| `last_name` | `TEXT` | NULL | Фамилия |
| `username` | `TEXT` | NULL | @username |
| `locale` | `VARCHAR(5)` | NOT NULL, default `'en'` | Язык: `en` \| `ru` |
| `current_streak` | `INT` | NOT NULL, default `0` | Текущая серия (дни) |
| `longest_streak` | `INT` | NOT NULL, default `0` | Рекорд серии |
| `last_meal_date` | `DATE` | NULL | Последний день с логом |
| `team_id` | `UUID` | FK → `teams`, ON DELETE SET NULL | Текущая команда |
| `star_balance` | `INT` | NOT NULL, default `0` | Баланс Stars (in-app) |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | Первый визит |

**Индексы:** `users_team_id_idx` на `team_id`

**Бизнес-правила:**

- Upsert при каждом авторизованном API-запросе  
- MVP: одна команда на пользователя  
- Серия сбрасывается в 0, если `last_meal_date < вчера` (cron)  

---

### 2.3 `team_members` — состав команд

Связь many-to-many (история членства).

| Колонка | Тип | Ограничения | Описание |
|---------|-----|-------------|----------|
| `team_id` | `UUID` | PK (составной), FK | Команда |
| `user_id` | `BIGINT` | PK (составной), FK | Пользователь |
| `joined_at` | `TIMESTAMPTZ` | NOT NULL | Дата вступления |

---

### 2.4 `meals` — приёмы пищи

| Колонка | Тип | Ограничения | Описание |
|---------|-----|-------------|----------|
| `id` | `UUID` | PK | ID записи |
| `user_id` | `BIGINT` | FK, NOT NULL | Кто залогировал |
| `team_id` | `UUID` | FK, NULL | Команда на момент лога |
| `description` | `TEXT` | NOT NULL | Название блюда |
| `calories` | `INT` | NOT NULL | Ккал |
| `protein` | `INT` | NOT NULL, default `0` | Белок, г |
| `points` | `INT` | NOT NULL | Личные очки |
| `photo_url` | `TEXT` | NULL | URL фото в S3 |
| `photo_key` | `TEXT` | NULL | Ключ объекта S3 |
| `ai_source` | `VARCHAR(32)` | NULL | `openai` \| `fallback` |
| `ai_confidence` | `FLOAT` | NULL | Уверенность ИИ 0–1 |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | Время лога |

**Индексы:** `(user_id, created_at)`, `(team_id, created_at)`

**Бизнес-правила:**

- `points` — личные очки (с множителем серии)  
- Очки команды добавляются отдельно в `weekly_team_scores`  
- Фото: `meals/{user_id}/{uuid}.jpg` в S3  

---

### 2.5 `weekly_team_scores` — недельные очки команд

| Колонка | Тип | Ограничения | Описание |
|---------|-----|-------------|----------|
| `team_id` | `UUID` | PK (составной), FK | Команда |
| `week_key` | `VARCHAR(10)` | PK (составной) | Неделя, напр. `2026-W22` |
| `points` | `INT` | NOT NULL, default `0` | Сумма очков |

**Бизнес-правила:**

- Инкремент при каждом meal с учётом множителя команды  
- Рейтинг: `ORDER BY points DESC` для `week_key`  

---

### 2.6 `prize_pools` — призовые фонды Stars

| Колонка | Тип | Ограничения | Описание |
|---------|-----|-------------|----------|
| `id` | `UUID` | PK | ID фонда |
| `team_id` | `UUID` | FK, NOT NULL | Команда |
| `week_key` | `VARCHAR(10)` | NOT NULL | Неделя |
| `stars_total` | `INT` | NOT NULL, default `0` | Всего Stars |
| `stars_distributed` | `INT` | NOT NULL, default `0` | Уже раздано |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | Создан |

**Unique:** `(team_id, week_key)`

**Бизнес-правила:**

- Пополнение через `payments` типа `pool_fund`  
- Понедельник: ~80% фонда (#1 команда, активные участники)  
- `stars_distributed` увеличивается после выплаты  

---

### 2.7 `payments` — платежи Telegram Stars

| Колонка | Тип | Ограничения | Описание |
|---------|-----|-------------|----------|
| `id` | `UUID` | PK | ID |
| `user_id` | `BIGINT` | FK, NOT NULL | Плательщик |
| `team_id` | `UUID` | NULL | Команда |
| `payload` | `TEXT` | UNIQUE, NOT NULL | Payload инвойса |
| `payment_type` | `VARCHAR(32)` | NOT NULL | `pool_fund` \| `premium` |
| `stars_amount` | `INT` | NOT NULL | Сумма Stars |
| `status` | `VARCHAR(16)` | NOT NULL, default `'pending'` | Статус |
| `telegram_payment_charge_id` | `TEXT` | NULL | ID от Telegram |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | Создан |
| `completed_at` | `TIMESTAMPTZ` | NULL | Оплачен |

**Бизнес-правила:**

- Идемпотентность: повторный `completed` игнорируется  
- `pool_fund` → `prize_pools.stars_total`  
- `premium` → `teams.is_premium`, `premium_until`  

---

### 2.8 `prize_awards` — история выигрышей

| Колонка | Тип | Ограничения | Описание |
|---------|-----|-------------|----------|
| `id` | `UUID` | PK | ID награды |
| `user_id` | `BIGINT` | FK, NOT NULL | Победитель |
| `team_id` | `UUID` | NOT NULL | Команда |
| `week_key` | `VARCHAR(10)` | NOT NULL | Неделя |
| `stars_amount` | `INT` | NOT NULL | Stars |
| `status` | `VARCHAR(16)` | NOT NULL, default `'credited'` | Статус |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | Время |

**Индекс:** `(user_id, week_key)`

---

### 2.9 `star_transactions` — ledger Stars

| Колонка | Тип | Ограничения | Описание |
|---------|-----|-------------|----------|
| `id` | `UUID` | PK | ID транзакции |
| `user_id` | `BIGINT` | FK, NOT NULL | Пользователь |
| `amount` | `INT` | NOT NULL | Сумма (+ зачисление) |
| `type` | `VARCHAR(32)` | NOT NULL | Тип, напр. `prize_win` |
| `reference_id` | `TEXT` | NULL | Ссылка |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | Время |

**Индекс:** `user_id`

---

## 3. Справочники и конвенции

### 3.1 `locale` — язык интерфейса

| Значение | Язык |
|----------|------|
| `en` | English |
| `ru` | Русский |

### 3.2 `weekly_goal_type` — тип недельной цели

| Значение | Источник прогресса |
|----------|-------------------|
| `points` | `weekly_team_scores.points` |
| `protein` | `SUM(meals.protein)` с начала недели |
| `calories` | `SUM(meals.calories)` с начала недели |

### 3.3 `week_key` — ключ недели

ISO-неделя UTC: `YYYY-Www`, функция `getCurrentWeekKey()`.

### 3.4 `payment_type` — тип платежа

| Значение | Действие |
|----------|----------|
| `pool_fund` | Пополнение `prize_pools` |
| `premium` | Активация Premium команды |

### 3.5 `star_transaction.type`

| Значение | Описание |
|----------|----------|
| `prize_win` | Выплата за победу в недельной битве |

---

## 4. Примеры запросов

### Очки пользователя за сегодня

```sql
SELECT COALESCE(SUM(points), 0)
FROM meals
WHERE user_id = $1 AND created_at::date = CURRENT_DATE;
```

### Кто залогировал сегодня (множитель команды)

```sql
SELECT COUNT(DISTINCT user_id)
FROM meals
WHERE team_id = $1 AND created_at::date = CURRENT_DATE;
```

### Рейтинг недели

```sql
SELECT t.name, w.points
FROM weekly_team_scores w
JOIN teams t ON t.id = w.team_id
WHERE w.week_key = $1
ORDER BY w.points DESC
LIMIT 20;
```

---

## 5. Миграции

| Команда | Назначение |
|---------|------------|
| `npx prisma migrate deploy` | Применить миграции |
| `npx prisma db push` | Синхронизация в dev |
| `npx prisma studio` | GUI для данных |
| `npm run db:seed -w server` | Демо-команды и фонды |

**Начальная миграция:** `server/prisma/migrations/20250529120000_init/`

**Расширение:** `pgcrypto` (для `gen_random_uuid()`).

---

## 6. S3 (вне PostgreSQL)

Ссылки в `meals.photo_url` / `photo_key`.

| Параметр | Dev (MinIO) |
|----------|-------------|
| Bucket | `nutricrew` |
| Путь | `meals/{user_id}/{uuid}.jpg` |
| Endpoint | `http://localhost:9000` |

---

## 7. Хранение данных (рекомендации)

| Данные | Рекомендация |
|--------|--------------|
| `meals` | Хранить без ограничения (история) |
| `star_transactions` | Аудит, не удалять |
| Фото S3 | Lifecycle 90 дней (будущее) |
| `payments` | Финансовый аудит |

---

## 8. Связанные документы

- [Спецификация (RU)](./SPEC.md)  
- [Product spec (EN)](../en/SPEC.md)  
- [Database schema (EN)](../en/DATABASE.md)
