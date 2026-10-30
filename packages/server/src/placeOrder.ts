/**
 * Places an order end to end: validate, save + take portions, pay, confirm by SMS.
 */
import {
  applyMenuUpdates,
  validateOrder,
  type OrderError,
  type OrderRequest,
} from "@jollofco/core";
import { SoldOutError, type OrderStore } from "./db";
import type { PaymentProvider } from "./payments";
import type { MessageProvider } from "./sms";

export interface Services {
  store: OrderStore;
  payments: PaymentProvider;
  messages: MessageProvider;
}

export type PlaceOrderResult =
  | { ok: true; orderId: string; number: string; total: number; paymentUrl?: string }
  | { ok: false; errors: Array<OrderError | "payment-failed"> };

export async function placeOrder(
  req: OrderRequest,
  now: Date,
  { store, payments, messages }: Services,
): Promise<PlaceOrderResult> {
  // Prices and dishes on/off as the admin set them, so totals match what the customer saw.
  applyMenuUpdates(await store.menu());
  const sold = await store.soldOn(req.cart.date);
  const check = validateOrder(req, now, sold);
  if (!check.ok) return check;

  let saved;
  try {
    saved = await store.createOrder(
      {
        delivery_date: req.cart.date,
        kind: check.kind,
        slot: req.slot,
        customer_name: req.name.trim(),
        phone: check.phone,
        zone_id: req.address.zoneId,
        street: req.address.street.trim(),
        building: req.address.building.trim(),
        unit: req.address.unit?.trim() || undefined,
        note: req.address.note?.trim() || undefined,
        payment_method: req.payment,
        subtotal_qar: check.totals.subtotal,
        delivery_qar: check.totals.delivery,
        total_qar: check.totals.total,
      },
      req.cart.lines.map((l) => ({ dish_id: l.dishId, qty: l.qty })),
    );
  } catch (e) {
    // Someone took the last portion between validation and saving.
    if (e instanceof SoldOutError) return { ok: false, errors: ["dish-unavailable"] };
    throw e;
  }

  let paymentUrl: string | undefined;
  if (req.payment !== "cash") {
    const payment = await payments.createPayment({
      orderId: saved.id,
      orderNumber: saved.number,
      amountQar: check.totals.total,
      method: req.payment,
    });
    if (payment.status === "failed") {
      await store.setPayment(saved.id, "failed");
      await store.cancelOrder(saved.id);
      return { ok: false, errors: ["payment-failed"] };
    }
    if (payment.status === "paid") await store.setPayment(saved.id, "paid", payment.reference);
    else paymentUrl = payment.url;
  }

  await messages.send(
    check.phone,
    `jollof&co: order ${saved.number} received, total QAR ${check.totals.total}. Thank you!`,
  );

  return {
    ok: true,
    orderId: saved.id,
    number: saved.number,
    total: check.totals.total,
    paymentUrl,
  };
}
