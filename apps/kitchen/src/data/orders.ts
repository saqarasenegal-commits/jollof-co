/**
 * Where the kitchen screen gets its orders.
 *
 * `supabaseKitchen` reads the day's orders, follows changes live (realtime) and
 * calls set_order_status / assign_rider. `demoKitchen` holds sample orders in
 * memory so the screen can be tried without a backend. Same interface for both.
 */
import {
  canTransition,
  dishesOfTheDay,
  type IsoDate,
  type KitchenOrder,
  type OrderStatus,
} from "@jollofco/core";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface Rider {
  id: string;
  name: string;
}

export interface KitchenSource {
  riders(): Promise<Rider[]>;
  /** Hands a cooked order to a rider (status becomes "on_the_way"). */
  assignRider(orderId: string, riderId: string): Promise<void>;
  /** Calls `onChange` now and every time the day's orders change. Returns an unsubscribe function. */
  watch(date: IsoDate, onChange: (orders: KitchenOrder[]) => void): () => void;
  setStatus(orderId: string, status: OrderStatus): Promise<void>;
}

export function demoKitchen(date: IsoDate, now: Date): KitchenSource {
  const special = dishesOfTheDay(date)[0]!.id; // today's slow-cooked dish
  const minutesAgo = (m: number) => new Date(now.getTime() - m * 60_000).toISOString();
  let orders: KitchenOrder[] = [
    {
      id: "1",
      number: "JC-1001",
      deliveryDate: date,
      slot: "asap",
      createdAt: minutesAgo(18),
      status: "cooking",
      customerName: "Aïssatou D.",
      zoneId: "al-sadd",
      lines: [
        { dishId: "yassa", qty: 2 },
        { dishId: "bissap", qty: 2 },
      ],
    },
    {
      id: "2",
      number: "JC-1002",
      deliveryDate: date,
      slot: "asap",
      createdAt: minutesAgo(6),
      status: "received",
      customerName: "Omar K.",
      zoneId: "the-pearl",
      note: "Extra pili pili please",
      lines: [
        { dishId: "nyama", qty: 1 },
        { dishId: "ugali", qty: 1 },
        { dishId: "alloco", qty: 1 },
      ],
    },
    {
      id: "3",
      number: "JC-1003",
      deliveryDate: date,
      slot: "19:00-20:00",
      createdAt: minutesAgo(240),
      status: "received",
      customerName: "Fatima A.",
      zoneId: "lusail",
      lines: [
        { dishId: special, qty: 3 },
        { dishId: "attieke", qty: 1 },
        { dishId: "thiakry", qty: 2 },
      ],
    },
    {
      id: "4",
      number: "JC-0998",
      deliveryDate: date,
      slot: "asap",
      createdAt: minutesAgo(70),
      status: "delivered",
      customerName: "Grace N.",
      zoneId: "west-bay",
      lines: [{ dishId: "feast", qty: 1 }],
    },
  ];
  const listeners = new Set<(o: KitchenOrder[]) => void>();
  const emit = () => listeners.forEach((l) => l(orders));

  return {
    async riders() {
      return [
        { id: "r1", name: "Moussa" },
        { id: "r2", name: "Kofi" },
      ];
    },
    async assignRider(orderId) {
      await this.setStatus(orderId, "on_the_way");
    },
    watch(_date, onChange) {
      listeners.add(onChange);
      onChange(orders);
      return () => listeners.delete(onChange);
    },
    async setStatus(orderId, status) {
      orders = orders.map((o) => {
        if (o.id !== orderId) return o;
        if (!canTransition(o.status, status))
          throw new Error(`Cannot go from ${o.status} to ${status}`);
        return { ...o, status };
      });
      emit();
    },
  };
}

const ORDER_COLUMNS =
  "id, number, delivery_date, slot, created_at, status, customer_name, zone_id, note, order_items(dish_id, qty)";

/** Needs a signed-in kitchen or admin account (RLS and the SQL functions check the role). */
export function supabaseKitchen(client: SupabaseClient): KitchenSource {
  async function load(date: IsoDate): Promise<KitchenOrder[]> {
    const { data, error } = await client
      .from("orders")
      .select(ORDER_COLUMNS)
      .eq("delivery_date", date);
    if (error) throw error;
    return data.map((o) => ({
      id: o.id,
      number: o.number,
      deliveryDate: o.delivery_date,
      slot: o.slot,
      createdAt: o.created_at,
      status: o.status,
      customerName: o.customer_name,
      zoneId: o.zone_id,
      note: o.note ?? undefined,
      lines: o.order_items.map((i: { dish_id: string; qty: number }) => ({
        dishId: i.dish_id,
        qty: i.qty,
      })),
    }));
  }

  // Screens watching right now; refreshed straight after our own changes too.
  const refreshers = new Set<() => void>();

  async function rpc(name: string, args: Record<string, unknown>) {
    const { error } = await client.rpc(name, args);
    if (error) throw new Error(error.message);
    refreshers.forEach((r) => r());
  }

  return {
    async riders() {
      const { data, error } = await client
        .from("staff")
        .select("user_id, name")
        .eq("role", "rider");
      if (error) throw error;
      return data.map((r) => ({ id: r.user_id, name: r.name }));
    },
    assignRider: (orderId, riderId) =>
      rpc("assign_rider", { p_order_id: orderId, p_rider_id: riderId }),
    setStatus: (orderId, status) =>
      rpc("set_order_status", { p_order_id: orderId, p_status: status }),
    watch(date, onChange) {
      let active = true;
      const refresh = () =>
        load(date).then(
          (orders) => active && onChange(orders),
          () => {}, // offline: keep showing the last list, the next change or poll retries
        );
      refresh();
      refreshers.add(refresh);
      // Live updates when an order arrives or changes, plus a poll in case the connection dropped.
      const channel = client
        .channel(`kitchen-${date}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, refresh)
        .subscribe();
      const poll = setInterval(refresh, 30_000);
      return () => {
        active = false;
        refreshers.delete(refresh);
        clearInterval(poll);
        client.removeChannel(channel);
      };
    },
  };
}
