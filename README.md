# jollof&co

Ordering app for **jollof&co**, a Pan-African cloud kitchen in Doha, Qatar. Delivery only, direct
orders, own riders (no Talabat, Snoonu or Rafeeq).

🇫🇷 [Lire en français](README.fr.md)

## What's inside

```
packages/
  core/        Business rules shared by every app: menu, region of the day,
               40-portion limit, pre-order cut-off, prices. Pure TypeScript, fully tested.
docs/          Architecture, business rules, decisions.
scripts/       setup.sh: one-command setup for new developers.
.github/       CI: formatting, type checks and tests on every push.
```

Coming next (see [docs/ROADMAP.md](docs/ROADMAP.md)): the customer app (Expo / React Native, English
and Arabic with right-to-left layout), the Supabase backend, the kitchen screen, the rider app and
the admin.

## Getting started

Requirements: Node.js 20 or newer.

```bash
./scripts/setup.sh     # installs dependencies and runs every check
```

Everyday commands:

| Command             | What it does                        |
| ------------------- | ----------------------------------- |
| `npm test`          | Run all tests                       |
| `npm run typecheck` | Check TypeScript types              |
| `npm run format`    | Format all files with Prettier      |
| `npm run check`     | Everything CI runs, before you push |

## Where to change things

| I want to change…                          | File                          |
| ------------------------------------------ | ----------------------------- |
| Prices, dishes, descriptions (EN/AR)       | `packages/core/src/menu.ts`   |
| Region of each weekday                     | `packages/core/src/config.ts` |
| Portions per day, pre-order cut-off, hours | `packages/core/src/config.ts` |
| Minimum order, free delivery, WhatsApp     | `packages/core/src/config.ts` |
| Delivery zones and fees                    | `packages/core/src/zones.ts`  |

Business rules are explained in plain words in [docs/BUSINESS_RULES.md](docs/BUSINESS_RULES.md).
Values marked **PLACEHOLDER** in the code are not confirmed by the owner yet.

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md). In short: one branch per change, tests for every rule,
`npm run check` must pass, and CI must be green before merging.
