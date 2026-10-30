# Admin / Administration

Back office for the owner, in French. Two tabs:

- **Menu et prix**: change a dish's price, take a dish off the menu or put it back.
- **Portions par jour**: for today and the next 6 days, change how many portions of each dish of
  the day are cooked (never below what is already sold).

```bash
npm run web -w @jollofco/admin
```

Data goes through `src/data/admin.ts`: with `.env` (`cp .env.example .env`) the owner signs in
and changes go to the live database (`update_dish`, `set_portions`, admin only; accounts in
`docs/STAFF.md`); without it, an in-memory demo. Input rules:
`packages/core/src/admin.ts`.

FR : back-office du propriétaire. Modifier les prix, retirer ou remettre un plat, changer le nombre
de portions des plats du jour pour les 7 prochains jours. Avec le fichier `.env`, connexion avec
votre compte et changements enregistrés dans la base.
