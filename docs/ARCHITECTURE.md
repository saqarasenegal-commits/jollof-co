# Architecture

Chosen to be **mainstream and easy to hire for**: any React / TypeScript freelancer can maintain it.

| Part                   | Technology                          | Status  |
| ---------------------- | ----------------------------------- | ------- |
| Business rules         | TypeScript package `packages/core`  | Done    |
| Customer app           | Expo (React Native), iOS + Android  | Next    |
| Rider app              | Expo, same codebase style           | Planned |
| Kitchen screen + admin | Web (Expo web or React) on a tablet | Planned |
| Backend                | Supabase (Postgres, auth, realtime) | Next    |
| Payments               | Qatar gateway (SADAD/SkipCash/Tap)  | Sandbox |
| SMS / WhatsApp         | Provider TBD                        | Sandbox |

## Principles

1. **One source of truth for rules.** `packages/core` holds the rules; the apps display them and the
   database enforces them (for example, the 40-portion limit is also checked in a database
   transaction so two customers can't buy the last portion).
2. **No vendor lock-in for payments and SMS.** Each sits behind a small interface with a sandbox
   implementation, so the real provider is a configuration change.
3. **Everything testable without the clock or the network.**

## Repository layout

npm workspaces monorepo. Each folder under `packages/` (and later `apps/`) has its own
`package.json`, tests and README.
