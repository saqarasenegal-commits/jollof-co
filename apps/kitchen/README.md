# Kitchen screen / Écran cuisine

Expo app meant for a tablet in the kitchen (landscape). Shows:

- the orders to prepare, ASAP first then by delivery slot, with one big button to move each order
  forward (New → Cooking → With rider → Delivered) and a cancel link;
- on the left, how many portions of each dish are ordered today and how many of the 40 are left.

```bash
npm run web -w @jollofco/kitchen     # open in the browser
```

Orders come from `src/data/orders.ts`. It uses sample orders until the Supabase backend is
deployed (the database side is ready: `set_order_status` and the `staff` table in
`supabase/migrations`). Rules (status steps, ticket order, prep list) live in
`packages/core/src/kitchen.ts`.

FR : écran pour la tablette en cuisine. Commandes à préparer, bouton pour avancer chaque commande,
et à gauche le nombre de portions à cuisiner. Données d'exemple tant que Supabase n'est pas en ligne.
