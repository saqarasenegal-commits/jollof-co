/**
 * Checks an order before it is paid. The same function runs in the app (to show
 * errors) and on the server (the server's answer is the one that counts).
 */
import { canOrderFor, qatarInstant } from "./calendar";
import { addToCart, type Cart } from "./cart";
import { DELIVERY_SLOTS, MIN_ORDER_QAR, PAYMENT_METHODS, SLOT_LEAD_MINUTES } from "./config";
import { cartTotals, type CartTotals } from "./pricing";
import { findZone } from "./zones";

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
export type DeliverySlot = (typeof DELIVERY_SLOTS)[number];

/** Qatar address: zone, street and building numbers from the blue plate, plus unit. */
export interface Address {
  zoneId: string;
  street: string;
  building: string;
  unit?: string;
  note?: string;
}

export interface OrderRequest {
  cart: Cart;
  name: string;
  /** Qatar mobile, with or without +974 and spaces. */
  phone: string;
  address: Address;
  /** "asap" is only possible for today. Pre-orders always need a slot. */
  slot: "asap" | DeliverySlot;
  payment: PaymentMethod;
}

export type OrderError =
  | "empty-cart"
  | "day-closed"
  | "dish-unavailable"
  | "below-minimum"
  | "name-missing"
  | "phone-invalid"
  | "zone-unknown"
  | "address-invalid"
  | "slot-invalid"
  | "cash-not-for-preorder";

export type OrderCheck =
  | { ok: true; kind: "today" | "preorder"; phone: string; totals: CartTotals }
  | { ok: false; errors: OrderError[] };

/** Returns the 8-digit local number, or null if it is not a Qatar mobile (starts with 3, 5, 6 or 7). */
export function normalizeQatarMobile(input: string): string | null {
  let digits = input.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("974")) digits = digits.slice(3);
  return /^[3567]\d{7}$/.test(digits) ? digits : null;
}

const plateNumber = (s: string) => /^\d{1,4}$/.test(s.trim());

export function validateOrder(
  req: OrderRequest,
  now: Date,
  sold: Record<string, number> = {},
): OrderCheck {
  const errors: OrderError[] = [];
  const day = canOrderFor(req.cart.date, now);

  if (req.cart.lines.length === 0) errors.push("empty-cart");
  if (!day) errors.push("day-closed");

  // Re-add every line to an empty basket: this re-checks the day and the portions left.
  let check: Cart = { date: req.cart.date, lines: [] };
  for (const line of req.cart.lines) {
    const r = addToCart(check, line.dishId, line.qty, sold);
    if (r.ok) check = r.cart;
    else if (!errors.includes("dish-unavailable")) errors.push("dish-unavailable");
  }

  if (!req.name.trim()) errors.push("name-missing");
  const phone = normalizeQatarMobile(req.phone);
  if (!phone) errors.push("phone-invalid");

  const zone = findZone(req.address.zoneId);
  if (!zone) errors.push("zone-unknown");
  if (!plateNumber(req.address.street) || !plateNumber(req.address.building)) {
    errors.push("address-invalid");
  }

  if (day) {
    if (req.slot === "asap") {
      if (day.kind === "preorder") errors.push("slot-invalid");
    } else if (!DELIVERY_SLOTS.includes(req.slot)) {
      errors.push("slot-invalid");
    } else if (day.kind === "today") {
      const [hour, minute] = req.slot.slice(0, 5).split(":").map(Number) as [number, number];
      const start = qatarInstant(req.cart.date, hour, minute);
      if (start.getTime() - now.getTime() < SLOT_LEAD_MINUTES * 60_000) errors.push("slot-invalid");
    }
    if (day.kind === "preorder" && req.payment === "cash") errors.push("cash-not-for-preorder");
  }

  let totals: CartTotals | undefined;
  if (zone && check.lines.length) {
    totals = cartTotals(check.lines, zone);
    if (totals.subtotal < MIN_ORDER_QAR) errors.push("below-minimum");
  }

  if (errors.length || !day || !phone || !totals) return { ok: false, errors };
  return { ok: true, kind: day.kind, phone, totals };
}
