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
