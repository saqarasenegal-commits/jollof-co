/**
 * What order placement needs from the database. SupabaseOrderStore is the real
 * one; tests use an in-memory fake, so the logic is tested without a server.
 */
import { soldAgainstDefault, type DishUpdate, type IsoDate } from "@jollofco/core";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface NewOrder {
  delivery_date: IsoDate;
  kind: "today" | "preorder";
  slot: string;
  customer_name: string;
  phone: string;
  zone_id: string;
  street: string;
  building: string;
  unit?: string;
  note?: string;
  payment_method: string;
  subtotal_qar: number;
  delivery_qar: number;
  total_qar: number;
}

export interface SavedOrder {
  id: string;
  number: string;
}

export class SoldOutError extends Error {
  constructor(readonly dishId: string) {
    super(`sold_out:${dishId}`);
  }
}

export interface OrderStore {
  /** Live prices and on/off state of every dish (see applyMenuUpdates). */
  menu(): Promise<DishUpdate[]>;
  /** Portions already taken for each dish of the day on that date. */
  soldOn(date: IsoDate): Promise<Record<string, number>>;
  /** Saves the order and takes the portions atomically. Throws SoldOutError if one ran out. */
  createOrder(order: NewOrder, items: Array<{ dish_id: string; qty: number }>): Promise<SavedOrder>;
  setPayment(orderId: string, status: "paid" | "failed", reference?: string): Promise<void>;
  /** Marks the order cancelled and gives its portions back. */
  cancelOrder(orderId: string): Promise<void>;
}

/** Uses the tables and functions in supabase/migrations. Needs the service-role key (server only). */
export class SupabaseOrderStore implements OrderStore {
  constructor(private readonly client: SupabaseClient) {}

  async menu() {
    const { data, error } = await this.client.from("dishes").select("id, price_qar, active");
    if (error) throw error;
    return (data ?? []).map((r) => ({
      id: r.id as string,
      price: Number(r.price_qar),
      active: r.active as boolean,
    }));
  }

  async soldOn(date: IsoDate) {
    const { data, error } = await this.client
      .from("daily_stock")
      .select("dish_id, sold, portions")
      .eq("delivery_date", date);
    if (error) throw error;
    return Object.fromEntries(
      (data ?? []).map((r) => [r.dish_id as string, soldAgainstDefault(r.sold, r.portions)]),
    );
  }

  async createOrder(order: NewOrder, items: Array<{ dish_id: string; qty: number }>) {
    const { data, error } = await this.client.rpc("create_order", {
      p_order: order,
      p_items: items,
    });
    if (error) {
      const soldOut = /sold_out:(\S+)/.exec(error.message);
      if (soldOut) throw new SoldOutError(soldOut[1]!);
      throw error;
    }
    return { id: data.id as string, number: data.number as string };
  }

  async setPayment(orderId: string, status: "paid" | "failed", reference?: string) {
    const { error } = await this.client
      .from("orders")
      .update({ payment_status: status, payment_ref: reference ?? null })
      .eq("id", orderId);
    if (error) throw error;
  }

  async cancelOrder(orderId: string) {
    const { error } = await this.client.rpc("cancel_order", { p_order_id: orderId });
    if (error) throw error;
  }
}
