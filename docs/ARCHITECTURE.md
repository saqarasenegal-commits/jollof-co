# Architecture

Chosen to be **mainstream and easy to hire for**: any React / TypeScript freelancer can maintain it.

| Part                   | Technology                          | Status      |
| ---------------------- | ----------------------------------- | ----------- |
| Business rules         | TypeScript package `packages/core`  | Done        |
| Customer app           | Expo (React Native), iOS + Android  | In progress |
| Rider app              | Expo, same codebase style           | Planned     |
| Kitchen screen + admin | Web (Expo web or React) on a tablet | In progress |
| Backend                | Supabase (Postgres, auth, realtime) | Next        |
| Payments               | Qatar gateway (SADAD/SkipCash/Tap)  | Sandbox     |
| SMS / WhatsApp         | Provider TBD                        | Sandbox     |

## Principles

1. **One source of truth for rules.** `packages/core` holds the rules; the apps display them and the
   database enforces them (for example, the 40-portion limit is also checked in a database
   transaction so two customers can't buy the last portion).
2. **No vendor lock-in for payments and SMS.** Each sits behind a small interface with a sandbox
   implementation, so the real provider is a configuration change.
3. **Everything testable without the clock or the network.**

## How an order is placed

1. The app checks the order with `validateOrder` (packages/core) to show errors immediately.
2. It sends the order to the server (`apps/customer/src/data/orders.ts`). Until the backend is
   deployed, a demo implementation is used.
3. The server (`packages/server`, `placeOrder`) validates again with fresh stock numbers, then calls
   the database function `create_order`, which saves the order and takes the portions in one
   transaction. If the last portion went to someone else, nothing is saved.
4. Card / Apple Pay: the payment provider is called. Sandbox for now. If payment fails, the order is
   cancelled and its portions are given back (`cancel_order`).
5. A confirmation is sent by SMS (printed to the console for now).

## Database

`supabase/migrations/` holds the schema, `supabase/seed.sql` is generated from the menu in
packages/core (`npm run db:seed`, checked by CI), and `supabase/tests/` holds database tests
(`DATABASE_URL=... npm run db:test`, run by CI on a real Postgres).

## Repository layout

npm workspaces monorepo. Each folder under `packages/` (and later `apps/`) has its own
`package.json`, tests and README.
