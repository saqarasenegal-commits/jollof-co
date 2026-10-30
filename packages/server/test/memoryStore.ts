import type { DishUpdate, IsoDate } from "@jollofco/core";
import { SoldOutError, type NewOrder, type OrderStore } from "../src";

/** In-memory stand-in for the database, with the same 40-portion rule. */
export class MemoryStore implements OrderStore {
  orders: Array<NewOrder & { id: string; number: string; payment?: string; cancelled?: boolean }> =
    [];
  sold: Record<string, number> = {};
  prices: DishUpdate[] = [];

  async menu() {
    return this.prices;
  }
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
