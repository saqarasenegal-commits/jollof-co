# Roadmap

| Phase | Content                                                                      | Status      |
| ----- | ---------------------------------------------------------------------------- | ----------- |
| 1     | Foundation: monorepo, business rules + tests, docs EN/FR, setup script, CI   | Done        |
| 2     | Customer app: menu of the day, region cards, 40-portion counter, EN/AR + RTL | Done        |
| 3     | Ordering: basket, address, pre-order, payment (sandbox), SMS login (sandbox) | In progress |
| 4     | Kitchen screen, rider app, admin (menu, prices, stock)                       | In progress |
| 5     | Go-live: real payment gateway, store accounts, monitoring                    | Planned     |

## Connecting the backend (once a Supabase project exists)

Every app reads and writes through a small data file with a demo implementation. Going live means
writing the Supabase version of each, without touching the screens:

- Done: `apps/customer/src/data/menu.ts` and `stock.ts` read `dishes` and `daily_stock` (see the
  app's `.env.example`). Names and descriptions ship with the app; prices and on/off come from the
  database through `applyMenuUpdates` (packages/core).
- Done: `apps/customer/src/data/orders.ts` posts to the `place-order` Edge Function
  (`supabase/functions/README.md`), which runs `placeOrder` from packages/server with live prices.
  Payment is still the sandbox (card orders are marked paid without charging): switch
  `PAYMENT_PROVIDER` before real customers order by card.
- Done: kitchen, rider and admin apps sign staff in (`packages/staff`, Supabase Auth) and use
  `supabaseKitchen`, `supabaseStops`, `supabaseAdmin`. Accounts: `docs/STAFF.md`.

## Waiting on the owner

- Real prices, delivery fees, minimum order, opening hours
- WhatsApp number
- Portion weights (grams)
- Arabic spelling of the brand name
- Payment gateway, SMS provider and Apple/Google developer accounts
