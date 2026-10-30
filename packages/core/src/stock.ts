/**
 * Limited portions for dishes of the day.
 * The real count is kept in the database; these helpers hold the rules so the
 * app, the kitchen screen and the server all agree.
 */
import { PORTIONS_PER_DAY } from "./config";
import type { Dish } from "./types";

/** Portions still available, given how many are already sold or pre-ordered for that day. */
export function portionsLeft(dish: Dish, alreadySold: number): number | null {
  if (!dish.dailySpecial) return null; // fixed menu: not limited
  return Math.max(0, PORTIONS_PER_DAY - alreadySold);
}

/**
 * The rules count down from PORTIONS_PER_DAY. When the admin set another number of
 * portions for a day (daily_stock.portions), convert the database's `sold` so the
 * "left" count stays right: 38 sold of 40 → 38; 10 sold of 10 → 40; 0 sold of 60 → -20.
 */
export function soldAgainstDefault(sold: number, portions: number): number {
  return sold - portions + PORTIONS_PER_DAY;
}

/** "Épuisé" / sold out. */
export function isSoldOut(dish: Dish, alreadySold: number): boolean {
  return portionsLeft(dish, alreadySold) === 0;
}

/** True if `qty` more portions can be taken without going over the daily limit. */
export function canReserve(dish: Dish, alreadySold: number, qty: number): boolean {
  const left = portionsLeft(dish, alreadySold);
  return qty > 0 && (left === null || qty <= left);
}
