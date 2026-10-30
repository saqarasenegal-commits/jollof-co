# Rider app / App livreur

Expo app for riders' phones. Each delivery shows the customer, the blue-plate address, the items,
whether cash must be collected, and buttons to call, WhatsApp, open the map and mark it delivered.

```bash
npm run web -w @jollofco/rider
```

Deliveries come from `src/data/stops.ts` (sample data until Supabase is deployed). The database
side is ready: `assign_rider` (kitchen hands over) and `mark_delivered` (only the assigned rider)
in `supabase/migrations`. Link and address rules: `packages/core/src/rider.ts`.

FR : app pour le téléphone des livreurs. Adresse, articles, montant en espèces à encaisser,
boutons Appeler, WhatsApp, Carte et Livré. Données d'exemple tant que Supabase n'est pas en ligne.
