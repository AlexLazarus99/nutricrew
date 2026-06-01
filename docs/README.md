# NutriCrew Documentation

Product specification and database reference in two languages.

| Document | English | Русский |
|----------|---------|---------|
| **Pitch one-pager** | [PITCH.md](./en/PITCH.md) · [PDF](./output/NutriCrew-Pitch-EN.pdf) | [PITCH.md](./ru/PITCH.md) · [PDF](./output/NutriCrew-Pitch-RU.pdf) |
| **UI prototype** | [prototype/index.html](./prototype/index.html) | same (EN/RU toggle inside) |
| **Product & API spec** | [SPEC.md](./en/SPEC.md) | [SPEC.md](./ru/SPEC.md) |
| **Database schema** | [DATABASE.md](./en/DATABASE.md) | [DATABASE.md](./ru/DATABASE.md) |

## Quick links

- Source schema (Prisma): [`server/prisma/schema.prisma`](../server/prisma/schema.prisma)
- API implementation: [`server/src/api/routes/`](../server/src/api/routes/)
- Mini App i18n: [`miniapp/src/locales/`](../miniapp/src/locales/)

## Generate pitch PDF

```bash
cd docs
npm install
npm run pitch:pdf
```

Output: `docs/output/NutriCrew-Pitch-EN.pdf` and `NutriCrew-Pitch-RU.pdf`

**Without Node:** open `docs/pdf/pitch-en.html` in Chrome → Print → Save as PDF (A4).

## Version

| Field | Value |
|-------|-------|
| Spec version | 0.2.0 |
| Last updated | 2026-05-29 |
| Supported locales | `en`, `ru` |
