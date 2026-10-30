/**
 * Kitchen rules: order statuses and what to cook.
 * The database enforces the same transitions (see set_order_status in supabase/migrations).
 */
import { findDish } from "./menu";
import type { CartLine, IsoDate, Section } from "./types";

/** Menu sections in kitchen order. */
const SECTIONS: readonly Section[] = ["mains", "sides", "drinks", "desserts", "combos"];

export const ORDER_STATUSES = [
  "received",
  "cooking",
  "on_the_way",
  "delivered",
  "cancelled",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

/** Allowed moves. An order can be cancelled until it leaves the kitchen. */
const TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  received: ["cooking", "cancelled"],
  cooking: ["on_the_way", "cancelled"],
  on_the_way: ["delivered"],
  delivered: [],
  cancelled: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

/** The main button on a kitchen ticket: the next step forward, if any. */
export function nextStatus(status: OrderStatus): OrderStatus | undefined {
  return TRANSITIONS[status].find((s) => s !== "cancelled");
}

export interface KitchenOrder {
  id: string;
  number: string;
  deliveryDate: IsoDate;
  /** "asap" or a slot like "12:00-13:00". */
  slot: string;
  createdAt: string;
  status: OrderStatus;
  customerName: string;
  zoneId: string;
  note?: string;
  lines: CartLine[];
}

/**
 * Order of the tickets on the kitchen screen: ASAP orders first by arrival time,
 * then scheduled orders by slot. Finished and cancelled orders go last.
 */
export function sortTickets(orders: readonly KitchenOrder[]): KitchenOrder[] {
  const done = (o: KitchenOrder) => o.status === "delivered" || o.status === "cancelled";
  const key = (o: KitchenOrder) =>
    o.slot === "asap" ? `0 ${o.createdAt}` : `1 ${o.slot} ${o.createdAt}`;
  return [...orders].sort(
    (a, b) => Number(done(a)) - Number(done(b)) || key(a).localeCompare(key(b)),
  );
}

export interface PrepLine {
  dishId: string;
  /** Portions in orders not started yet. */
  toCook: number;
  /** All portions for the day, cancelled orders excluded. */
  total: number;
}

/** How many portions of each dish the kitchen has to prepare for a day. */
export function prepList(orders: readonly KitchenOrder[], date: IsoDate): PrepLine[] {
  const lines = new Map<string, PrepLine>();
  for (const o of orders) {
    if (o.deliveryDate !== date || o.status === "cancelled") continue;
    for (const l of o.lines) {
      const line = lines.get(l.dishId) ?? { dishId: l.dishId, toCook: 0, total: 0 };
      line.total += l.qty;
      if (o.status === "received") line.toCook += l.qty;
      lines.set(l.dishId, line);
    }
  }
  const rank = (id: string) => SECTIONS.indexOf(findDish(id)?.section ?? "combos");
  return [...lines.values()].sort((a, b) => rank(a.dishId) - rank(b.dishId) || b.total - a.total);
}
