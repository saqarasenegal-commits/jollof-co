# Customer app / App client

Expo (React Native) app for iOS, Android and web. English and Arabic (right to left).

```bash
npm run start -w @jollofco/customer   # then press i (iOS), a (Android) or w (web)
```

- `App.tsx`: entry point (language, current time).
- `src/screens/`: one file per screen.
- `src/components/`: reusable pieces (region card, dish row).
- `src/i18n.ts`: every text in English and Arabic.
- `src/theme.ts`: brand colours.
- `src/data/`: where data comes from. `menu.ts` (live prices, dishes on/off) and `stock.ts`
  (portions sold) read Supabase when `.env` is set, otherwise demo data. `orders.ts` still uses
  demo orders until the place-order function is deployed.

To use the live database: `cp .env.example .env` in this folder, then restart Expo. The values are
the public URL and publishable key (safe in the app; never put the secret key here).

Business rules (which dishes today, portions left, pre-order cut-off) come from `@jollofco/core`;
never re-implement them here.

FR : l'app client. Les textes sont dans `src/i18n.ts`, les couleurs dans `src/theme.ts`, les règles
métier viennent de `packages/core`. Pour la base en ligne : `cp .env.example .env` dans ce dossier
(prix et plats actifs/désactivés depuis l'admin, compteur de portions).
