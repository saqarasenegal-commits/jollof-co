# Business rules

Plain-language description of how jollof&co works. Each rule points to the code and the test that
enforces it. Decisions were validated by the owner (mozde) on the dates shown.

## Orders

- **Direct orders only, own riders.** No aggregator (Talabat, Snoonu, Rafeeq) in the app.
  _Validated 2026-10-22._
- Minimum order, free-delivery threshold and zone fees: `config.ts`, `zones.ts`. **PLACEHOLDERS.**
- The server always recomputes totals before taking a payment (`pricing.ts`).

## Menu of the day

- **Fixed menu**: always available (grills, sides, drinks, desserts, combo).
- **Dishes of the day**: slow-cooked dishes, **one region per day**, all of that region's
  slow-cooked dishes. _Validated 2026-10-22._

  | Sun  | Mon  | Tue  | Wed   | Thu  | Fri   | Sat  |
  | ---- | ---- | ---- | ----- | ---- | ----- | ---- |
  | East | West | East | North | West | North | West |

  West: jollof, thiéboudienne, mafé. East: doro wat, Swahili pilau. North: couscous royal, chicken
  tagine, lamb tagine. Code: `calendar.ts` (`regionOfDay`, `dishesOfTheDay`).

- **40 portions per dish of the day**, with a live counter and a "sold out" label at zero.
  _Validated 2026-10-22._ Code: `stock.ts`. Portion weight in grams: to be defined.

## Pre-orders

- Customers can pre-order for **tomorrow only**.
- Pre-orders for a day **close at 22:00 the day before** (Qatar time). _Validated 2026-10-22._
- Pre-orders count against the same 40 portions.
- Code: `calendar.ts` (`orderableDays`, `preorderDeadline`).

## Home page

One card per region (West, East, North) showing its days, its dishes and a button: "order today",
"pre-order for tomorrow", or "pre-order opens on <day before>".

## Languages

English and Arabic, with full right-to-left layout in Arabic. Arabic wordmark "جولوف & كو": spelling
still to confirm.

---

## Résumé en français

Commandes directes uniquement avec nos livreurs. Menu fixe tous les jours, plus les plats mijotés
d'une région par jour (dim Est, lun Ouest, mar Est, mer Nord, jeu Ouest, ven Nord, sam Ouest), 40
portions par plat avec compteur et « épuisé ». Précommande pour le lendemain seulement, fermée à 22h
la veille. App en anglais et en arabe.
