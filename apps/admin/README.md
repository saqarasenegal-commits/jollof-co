# Admin / Administration

Back office for the owner, in French. Two tabs:

- **Menu et prix**: change a dish's price, take a dish off the menu or put it back.
- **Portions par jour**: for today and the next 6 days, change how many portions of each dish of
  the day are cooked (never below what is already sold).

```bash
npm run web -w @jollofco/admin
```

Data goes through `src/data/admin.ts` (in memory until Supabase is deployed). The database side is
ready: `update_dish` and `set_portions` in `supabase/migrations`, admin only. Input rules:
`packages/core/src/admin.ts`.

FR : back-office du propriétaire. Modifier les prix, retirer ou remettre un plat, changer le nombre
de portions des plats du jour pour les 7 prochains jours.
