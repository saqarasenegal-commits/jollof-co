/**
 * Where the rider app gets its deliveries.
 *
 * `supabaseStops` reads the orders handed to the signed-in rider (row level
 * security only returns those) and calls `mark_delivered`. `demoStops` holds
 * sample deliveries in memory. Same interface for both.
 */
import type { RiderStop } from "@jollofco/core";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface StopSource {
  watch(onChange: (stops: RiderStop[]) => void): () => void;
  markDelivered(orderId: string): Promise<void>;
}

export function demoStops(now: Date): StopSource {
  const minutesAgo = (m: number) => new Date(now.getTime() - m * 60_000).toISOString();
  let stops: RiderStop[] = [
    {
      orderId: "1",
      number: "JC-1001",
      customerName: "Aïssatou D.",
      phone: "55551234",
      zoneId: "al-sadd",
      street: "850",
      building: "12",
      unit: "3",
      cashToCollect: 0,
      lines: [
        { dishId: "yassa", qty: 2 },
        { dishId: "bissap", qty: 2 },
      ],
      pickedUpAt: minutesAgo(12),
    },
    {
      orderId: "2",
      number: "JC-1004",
      customerName: "Omar K.",
      phone: "66123456",
      zoneId: "the-pearl",
      street: "601",
      building: "27",
      note: "Tower 2, call from the lobby",
      cashToCollect: 77,
      lines: [
        { dishId: "nyama", qty: 1 },
        { dishId: "ugali", qty: 1 },
      ],
      pickedUpAt: minutesAgo(4),
    },
  ];
  const listeners = new Set<(s: RiderStop[]) => void>();
  return {
    watch(onChange) {
      listeners.add(onChange);
      onChange(stops);
      return () => listeners.delete(onChange);
    },
    async markDelivered(orderId) {
      stops = stops.filter((s) => s.orderId !== orderId);
      listeners.forEach((l) => l(stops));
    },
  };
}

const STOP_COLUMNS =
  "id, number, customer_name, phone, zone_id, street, building, unit, note, payment_status, total_qar, picked_up_at, order_items(dish_id, qty)";

/** Needs a signed-in rider (or admin, who sees every delivery on the way). */
export function supabaseStops(client: SupabaseClient): StopSource {
  async function load(): Promise<RiderStop[]> {
    const { data, error } = await client
      .from("orders")
      .select(STOP_COLUMNS)
      .eq("status", "on_the_way");
    if (error) throw error;
    return data.map((o) => ({
      orderId: o.id,
      number: o.number,
      customerName: o.customer_name,
      phone: o.phone,
      zoneId: o.zone_id,
      street: o.street,
      building: o.building,
      unit: o.unit ?? undefined,
      note: o.note ?? undefined,
      cashToCollect: o.payment_status === "cash_on_delivery" ? Number(o.total_qar) : 0,
      pickedUpAt: o.picked_up_at,
      lines: o.order_items.map((i: { dish_id: string; qty: number }) => ({
        dishId: i.dish_id,
        qty: i.qty,
      })),
    }));
  }

  // Screens watching right now; refreshed straight after marking a delivery too.
  const refreshers = new Set<() => void>();

  return {
    watch(onChange) {
      let active = true;
      const refresh = () =>
        load().then(
          (stops) => active && onChange(stops),
          () => {}, // no signal: keep the last list, the next change or poll retries
        );
      refresh();
      refreshers.add(refresh);
      const channel = client
        .channel("rider-stops")
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
    async markDelivered(orderId) {
      const { error } = await client.rpc("mark_delivered", { p_order_id: orderId });
      if (error) throw new Error(error.message);
      refreshers.forEach((r) => r());
    },
  };
}
