# Rider app / App livreur

Expo app for riders' phones. Each delivery shows the customer, the blue-plate address, the items,
whether cash must be collected, and buttons to call, WhatsApp, open the map and mark it delivered.

```bash
npm run web -w @jollofco/rider
```

Deliveries come from `src/data/stops.ts`: with `.env` (`cp .env.example .env`) the rider signs in
and sees only the orders the kitchen handed to them (`assign_rider`, `mark_delivered` in
`supabase/migrations`; accounts in `docs/STAFF.md`); without it, sample data. The session is kept
on the phone, so riders sign in once. Link and address rules: `packages/core/src/rider.ts`.

FR : app pour le téléphone des livreurs. Adresse, articles, montant en espèces à encaisser,
boutons Appeler, WhatsApp, Carte et Livré. Avec `.env`, chaque livreur se connecte et ne voit que ses livraisons.
