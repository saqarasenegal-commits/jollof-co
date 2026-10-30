/**
 * Where the rider app gets its deliveries.
 *
 * `demoStops` holds sample deliveries in memory. The Supabase version reads the
 * rider's own orders (row-level security only returns those) and calls
 * `mark_delivered`; it implements the same interface.
 */
import type { RiderStop } from "@jollofco/core";

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
