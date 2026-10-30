# jollof&co

Ordering app for **jollof&co**, a Pan-African cloud kitchen in Doha, Qatar. Delivery only, direct
orders, own riders (no Talabat, Snoonu or Rafeeq).

🇫🇷 [Lire en français](README.fr.md)

## What's inside

```
apps/
  customer/    Customer app (Expo / React Native), English + Arabic.
  kitchen/     Kitchen screen for a tablet: orders, statuses, portions to cook.
packages/
  brand/       Brand colours shared by the apps.
  core/        Business rules shared by every app: menu, region of the day,
               40-portion limit, pre-order cut-off, prices. Pure TypeScript, fully tested.
  server/      Order placement on the server: validation, stock, payment, SMS.
supabase/      Database schema, generated seed data, database tests.
docs/          Architecture, business rules, decisions.
scripts/       setup.sh: one-command setup for new developers.
.github/       CI: formatting, type checks and tests on every push.
```

Coming next (see [docs/ROADMAP.md](docs/ROADMAP.md)): ordering in the customer app, the Supabase backend, the kitchen screen, the rider app and
the admin.

## Getting started

Requirements: Node.js 20 or newer.

```bash
./scripts/setup.sh     # installs dependencies and runs every check
npm start              # runs the customer app (press w for web)
```

Everyday commands:

| Command             | What it does                               |
| ------------------- | ------------------------------------------ |
| `npm test`          | Run all tests                              |
| `npm run typecheck` | Check TypeScript types                     |
| `npm run format`    | Format all files with Prettier             |
| `npm run check`     | Everything CI runs, before you push        |
| `npm run db:seed`   | Regenerate supabase/seed.sql from the menu |
| `npm run db:test`   | Database tests (needs `DATABASE_URL`)      |

## Where to change things

| I want to change…                          | File                          |
| ------------------------------------------ | ----------------------------- |
| Prices, dishes, descriptions (EN/AR)       | `packages/core/src/menu.ts`   |
| Region of each weekday                     | `packages/core/src/config.ts` |
| Portions per day, pre-order cut-off, hours | `packages/core/src/config.ts` |
| Minimum order, free delivery, WhatsApp     | `packages/core/src/config.ts` |
| Delivery zones and fees                    | `packages/core/src/zones.ts`  |
| Delivery slots, payment methods            | `packages/core/src/config.ts` |

Business rules are explained in plain words in [docs/BUSINESS_RULES.md](docs/BUSINESS_RULES.md).
Values marked **PLACEHOLDER** in the code are not confirmed by the owner yet.

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md). In short: one branch per change, tests for every rule,
`npm run check` must pass, and CI must be green before merging.
