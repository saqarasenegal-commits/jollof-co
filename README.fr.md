# jollof&co

Application de commande de **jollof&co**, cuisine panafricaine en ligne (cloud kitchen) à Doha, au
Qatar. Livraison uniquement, commandes directes, livreurs maison (pas de Talabat, Snoonu ou Rafeeq).

🇬🇧 [Read in English](README.md)

## Contenu

```
apps/
  customer/    App client (Expo / React Native), anglais + arabe.
  kitchen/     Écran cuisine sur tablette : commandes, statuts, portions à cuisiner.
packages/
  brand/       Couleurs de la marque, communes aux apps.
  core/        Règles métier communes à toutes les apps : menu, région du jour,
               limite de 40 portions, heure limite de précommande, prix. TypeScript pur, testé.
  server/      Prise de commande côté serveur : validation, stock, paiement, SMS.
supabase/      Schéma de la base de données, données générées, tests de la base.
docs/          Architecture, règles métier, décisions.
scripts/       setup.sh : installation en une commande pour un nouveau développeur.
.github/       CI : formatage, types et tests à chaque envoi de code.
```

Prochaines étapes (voir [docs/ROADMAP.md](docs/ROADMAP.md)) : la commande dans l'app client, le backend Supabase, l'écran cuisine, l'app
livreur et l'administration.

## Démarrer

Prérequis : Node.js 20 ou plus récent.

```bash
./scripts/setup.sh     # installe les dépendances et lance toutes les vérifications
npm start              # lance l'app client (touche w pour le web)
```

Commandes courantes :

| Commande            | Rôle                                        |
| ------------------- | ------------------------------------------- |
| `npm test`          | Lancer tous les tests                       |
| `npm run typecheck` | Vérifier les types TypeScript               |
| `npm run format`    | Formater les fichiers avec Prettier         |
| `npm run check`     | Tout ce que la CI vérifie, avant d'envoyer  |
| `npm run db:seed`   | Régénérer supabase/seed.sql depuis le menu  |
| `npm run db:test`   | Tests de la base (besoin de `DATABASE_URL`) |

## Où modifier quoi

| Je veux changer…                               | Fichier                       |
| ---------------------------------------------- | ----------------------------- |
| Prix, plats, descriptions (EN/AR)              | `packages/core/src/menu.ts`   |
| Région de chaque jour de la semaine            | `packages/core/src/config.ts` |
| Portions par jour, heure limite, horaires      | `packages/core/src/config.ts` |
| Commande minimum, livraison gratuite, WhatsApp | `packages/core/src/config.ts` |
| Zones de livraison et frais                    | `packages/core/src/zones.ts`  |
| Créneaux de livraison, moyens de paiement      | `packages/core/src/config.ts` |

Les règles métier sont expliquées simplement dans [docs/BUSINESS_RULES.md](docs/BUSINESS_RULES.md)
(en anglais, avec résumé en français). Les valeurs marquées **PLACEHOLDER** dans le code ne sont pas
encore confirmées par le propriétaire du projet.

## Contribuer

Lire [CONTRIBUTING.md](CONTRIBUTING.md). En bref : une branche par modification, un test pour chaque
règle, `npm run check` doit passer et la CI doit être verte avant de fusionner.
