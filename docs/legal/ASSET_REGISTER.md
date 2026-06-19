# Реестр активов NutriCrew

**Правообладатель:** @ingritoo · hello@nutricrew.app  
**Обновлено:** 2026-06-19

Отмечайте ✅ когда актив оформлен на владельца.

## Код и документация

| Актив | Расположение | Владелец | Статус |
|-------|--------------|----------|--------|
| Монорепозиторий | github.com/AlexLazarus99/nutricrew | @ingritoo | ☐ |
| Server API + Bot | `server/` | @ingritoo | ☐ |
| Mini App (React) | `miniapp/` | @ingritoo | ☐ |
| Prisma schema | `server/prisma/` | @ingritoo | ☐ |
| Документация | `docs/` | @ingritoo | ☐ |
| NutriBird HTML game | `miniapp/public/bird-quest.html` | @ingritoo | ☐ |
| Лицензия | `LICENSE` (proprietary) | @ingritoo | ✅ |

## Бренд и контент

| Актив | Примечание | Статус |
|-------|------------|--------|
| NutriCrew | название продукта | ☐ TM |
| NutriBird / NutriRun | игровые модули | ☐ |
| LiteCrew / Pro | тарифные обозначения | ☐ |
| Маркетинг PNG/HTML | `docs/marketing/` | ☐ |
| 7-day deficit guide | `docs/marketing/7-day-deficit-guide-ru.md` | ☐ |
| Локали (14 языков) | `miniapp/src/locales/` | ☐ |

## Инфраструктура (заполнить фактические URL)

| Сервис | Назначение | Аккаунт владельца |
|--------|------------|-------------------|
| Telegram Bot | @nutricrew_bot (уточнить) | ☐ |
| Mini App URL | nutricrew-miniapp.vercel.app | ☐ |
| API | nutricrew-dddi.onrender.com | ☐ |
| PostgreSQL | Neon | ☐ |
| Object storage | S3 / MinIO | ☐ |
| Vercel | frontend deploy | ☐ |
| Render | backend deploy | ☐ |
| Tribute | LiteCrew / Pro подписки | ☐ |
| OpenAI / Anthropic / Gemini | AI vision | ☐ |
| Домен | nutricrew.app | ☐ |
| Email | hello@nutricrew.app | ☐ |
| Cal.com | cal.com/nutricrew | ☐ |

## Секреты (не передавать в git)

Хранятся только в `.env` / dashboard:

- `BOT_TOKEN`, `DATABASE_URL`, `TRIBUTE_API_KEY`
- `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`
- S3 keys, `WEBAPP_URL`

При сделке — ротация ключей после передачи.

## Метрики для покупателя (заполнить перед data room)

| Метрика | Значение |
|---------|----------|
| Всего пользователей (users) | |
| MAU (30 дней) | |
| DAU | |
| Платящие LiteCrew / Pro | |
| MRR (USD) | |
| Команд (teams) | |
| Организаций (B2B) | |

SQL для Neon:
```sql
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM users WHERE created_at > now() - interval '30 days';
SELECT COUNT(*) FROM users WHERE is_pro = true OR lite_crew_until > now();
```
