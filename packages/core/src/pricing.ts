/** Basket totals. The server recomputes them before payment; never trust the app's numbers. */
import { FREE_DELIVERY_FROM_QAR, MIN_ORDER_QAR } from "./config";
import { findDish } from "./menu";
import type { CartLine } from "./types";
import type { Zone } from "./zones";

export interface CartTotals {
  subtotal: number;
  delivery: number;
  total: number;
  /** Amount still missing to reach the minimum order (0 when reached). */
  missingForMinimum: number;
}

export function cartSubtotal(lines: readonly CartLine[]): number {
  return lines.reduce((sum, line) => {
    const dish = findDish(line.dishId);
    if (!dish) throw new Error(`Unknown dish: ${line.dishId}`);
    if (!Number.isInteger(line.qty) || line.qty < 1)
      throw new Error(`Invalid quantity for ${line.dishId}`);
    return sum + dish.price * line.qty;
  }, 0);
}

export function cartTotals(lines: readonly CartLine[], zone: Zone): CartTotals {
  const subtotal = cartSubtotal(lines);
  const delivery = subtotal >= FREE_DELIVERY_FROM_QAR ? 0 : zone.feeQar;
  return {
    subtotal,
    delivery,
    total: subtotal + delivery,
    missingForMinimum: Math.max(0, MIN_ORDER_QAR - subtotal),
  };
}
