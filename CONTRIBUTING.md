# Contributing / Contribuer

## Workflow

1. Create a branch from `main`: `git checkout -b feature/short-name`.
2. Make the change. Every business rule gets a test in the same package.
3. Run `npm run check` (formatting, types, tests).
4. Open a pull request. CI must be green before merging.

## Conventions

- **TypeScript, strict mode** everywhere.
- **Business rules live in `packages/core`** and nowhere else. Apps and the server import them, so
  a rule is written once and tested once.
- **Functions that depend on time take `now` as an argument**: never call `new Date()` inside a
  rule. This makes every rule testable for any day and hour.
- **All dates and times are Qatar time** (`Asia/Qatar`, UTC+3).
- **Every user-facing text exists in English and Arabic.** Check the Arabic layout (right to left).
- **Settings go in `config.ts`**, not in the middle of the code. Mark unconfirmed values with
  `PLACEHOLDER`.
- **Secrets never go in git.** Use `.env` (see `.env.example`).
- Code, comments and commit messages in English. User docs in English and French.

## Français, en bref

Une branche par modification, un test pour chaque règle, `npm run check` avant d'envoyer, CI verte
avant de fusionner. Les règles métier sont uniquement dans `packages/core`. Les réglages sont dans
`config.ts`. Aucun secret dans git.
