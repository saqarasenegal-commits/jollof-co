# Edge Functions

| Function      | What it does                                                   | JWT check                                |
| ------------- | -------------------------------------------------------------- | ---------------------------------------- |
| `place-order` | The customer app posts orders here (validate, save, pay, SMS). | Off (public: customers aren't signed in) |

The logic is **not** written here: it lives in `packages/server` (tested with Vitest). This folder
only holds the Deno entry point and a generated bundle of that package.

## Changing and deploying `place-order`

```bash
npm run fn:build        # rebuilds supabase/functions/place-order/bundle.js (CI checks it is up to date)
supabase functions deploy place-order --no-verify-jwt --project-ref akgnftrljbbpefloflsq
```

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are provided by Supabase automatically. Other
settings (`PAYMENT_PROVIDER`, `SMS_PROVIDER`) are set as function secrets in the Supabase
dashboard; without them the sandbox payment and console SMS are used.

FR : la logique est dans `packages/server`. Après une modification : `npm run fn:build`, puis la
commande de déploiement ci-dessus.
