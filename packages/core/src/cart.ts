/**
 * Basket rules. A basket is for one delivery day: the dishes of the day change
 * every day, so switching day removes what is no longer served.
 */
import { isServedOn } from "./calendar";
import { findDish } from "./menu";
import { canReserve } from "./stock";
import type { CartLine, IsoDate } from "./types";

export interface Cart {
  date: IsoDate;
  lines: CartLine[];
}

export type AddResult =
  | { ok: true; cart: Cart }
  | { ok: false; reason: "unknown-dish" | "not-served-that-day" | "not-enough-portions" };

/** Quantity of a dish already in the basket. */
export function qtyInCart(cart: Cart, dishId: string): number {
  return cart.lines.find((l) => l.dishId === dishId)?.qty ?? 0;
}

/**
 * Adds `qty` of a dish (use a negative qty to remove).
 * `sold` = portions already sold that day for each dish of the day.
 */
export function addToCart(
  cart: Cart,
  dishId: string,
  qty: number,
  sold: Record<string, number> = {},
): AddResult {
  const dish = findDish(dishId);
  if (!dish) return { ok: false, reason: "unknown-dish" };
  if (!isServedOn(dish, cart.date)) return { ok: false, reason: "not-served-that-day" };

  const next = qtyInCart(cart, dishId) + qty;
  if (qty > 0 && !canReserve(dish, sold[dishId] ?? 0, next)) {
    return { ok: false, reason: "not-enough-portions" };
  }
  const others = cart.lines.filter((l) => l.dishId !== dishId);
  const lines = next > 0 ? [...others, { dishId, qty: next }] : others;
  return { ok: true, cart: { ...cart, lines } };
}

/** Moves the basket to another day and drops dishes not served that day. */
export function changeCartDay(cart: Cart, date: IsoDate): { cart: Cart; removed: string[] } {
  const removed: string[] = [];
  const lines = cart.lines.filter((l) => {
    const dish = findDish(l.dishId);
    const keep = !!dish && isServedOn(dish, date);
    if (!keep) removed.push(l.dishId);
    return keep;
  });
  return { cart: { date, lines }, removed };
}

export function cartCount(cart: Cart): number {
  return cart.lines.reduce((n, l) => n + l.qty, 0);
}
