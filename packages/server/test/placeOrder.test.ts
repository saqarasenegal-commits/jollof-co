import { qatarInstant, type IsoDate, type OrderRequest } from "@jollofco/core";
import { describe, expect, it } from "vitest";
import {
  ConsoleMessages,
  placeOrder,
  SandboxPayments,
  SoldOutError,
  type NewOrder,
  type OrderStore,
  type PaymentProvider,
} from "../src";

/** In-memory stand-in for the database, with the same 40-portion rule. */
class MemoryStore implements OrderStore {
  orders: Array<NewOrder & { id: string; number: string; payment?: string; cancelled?: boolean }> =
    [];
  sold: Record<string, number> = {};

  async soldOn(_date: IsoDate) {
    return { ...this.sold };
  }
  async createOrder(order: NewOrder, items: Array<{ dish_id: string; qty: number }>) {
    for (const i of items) {
      if (i.dish_id === "jollof" && (this.sold.jollof ?? 0) + i.qty > 40)
        throw new SoldOutError(i.dish_id);
    }
    for (const i of items)
      if (i.dish_id === "jollof") this.sold.jollof = (this.sold.jollof ?? 0) + i.qty;
    const saved = {
      ...order,
      id: `id-${this.orders.length}`,
      number: `JC-${1001 + this.orders.length}`,
    };
    this.orders.push(saved);
    return saved;
  }
  async cancelOrder(orderId: string) {
    const o = this.orders.find((x) => x.id === orderId)!;
    o.cancelled = true;
    this.sold.jollof = 0;
  }
  async setPayment(orderId: string, status: "paid" | "failed") {
    this.orders.find((o) => o.id === orderId)!.payment = status;
  }
}

const MON = "2026-11-02";
const now = qatarInstant(MON, 12);
const req: OrderRequest = {
  cart: { date: MON, lines: [{ dishId: "jollof", qty: 2 }] },
  name: "Aïssatou",
  phone: "5555 1234",
  address: { zoneId: "west-bay", street: "850", building: "12" },
  slot: "asap",
  payment: "card",
};

function services(payments: PaymentProvider = new SandboxPayments()) {
  return { store: new MemoryStore(), payments, messages: new ConsoleMessages() };
}

describe("placeOrder", () => {
  it("saves, pays in the sandbox and sends a confirmation", async () => {
    const s = services();
    const r = await placeOrder(req, now, s);
    expect(r).toEqual({
      ok: true,
      orderId: "id-0",
      number: "JC-1001",
      total: 100,
      paymentUrl: undefined,
    });
    expect(s.store.orders[0]).toMatchObject({ phone: "55551234", total_qar: 100, payment: "paid" });
    expect(s.store.sold.jollof).toBe(2);
    expect(s.messages.sent[0]?.text).toContain("JC-1001");
  });

  it("returns validation errors without saving anything", async () => {
    const s = services();
    const r = await placeOrder({ ...req, phone: "123" }, now, s);
    expect(r).toEqual({ ok: false, errors: ["phone-invalid"] });
    expect(s.store.orders).toHaveLength(0);
  });

  it("reports a dish that sold out between validation and saving", async () => {
    const s = services();
    s.store.soldOn = async () => ({}); // stale read: looks available
    s.store.sold.jollof = 39;
    expect(await placeOrder(req, now, s)).toEqual({ ok: false, errors: ["dish-unavailable"] });
  });

  it("does not charge cash orders", async () => {
    const s = services();
    let charged = false;
    s.payments = {
      name: "spy",
      createPayment: async () => ((charged = true), { status: "paid", reference: "x" }),
    };
    const r = await placeOrder({ ...req, payment: "cash" }, now, s);
    expect(r.ok).toBe(true);
    expect(charged).toBe(false);
  });

  it("marks the order failed when the payment fails", async () => {
    const s = services({
      name: "declined",
      createPayment: async () => ({ status: "failed", reason: "card declined" }),
    });
    expect(await placeOrder(req, now, s)).toEqual({ ok: false, errors: ["payment-failed"] });
    expect(s.store.orders[0]).toMatchObject({ payment: "failed", cancelled: true });
    expect(s.store.sold.jollof).toBe(0);
    expect(s.messages.sent).toHaveLength(0);
  });
});
