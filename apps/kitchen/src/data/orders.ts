/**
 * Where the kitchen screen gets its orders.
 *
 * `demoKitchen` holds sample orders in memory so the screen can be tried without
 * a backend. The Supabase version will read the `orders` table and subscribe to
 * realtime changes; it implements the same interface, so screens don't change.
 */
import {
  canTransition,
  dishesOfTheDay,
  type IsoDate,
  type KitchenOrder,
  type OrderStatus,
} from "@jollofco/core";

export interface KitchenSource {
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
