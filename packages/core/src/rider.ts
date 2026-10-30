/**
 * Rider rules: what a rider sees for each delivery and the links to reach the customer.
 */
import { findZone } from "./zones";
import type { CartLine } from "./types";

export interface RiderStop {
  orderId: string;
  number: string;
  customerName: string;
  /** 8-digit Qatar mobile. */
  phone: string;
  zoneId: string;
  street: string;
  building: string;
  unit?: string;
  note?: string;
  /** Amount to collect, 0 if paid online. */
  cashToCollect: number;
  lines: CartLine[];
  /** When the kitchen handed the order over (ISO time). */
  pickedUpAt: string;
}

export interface StopLinks {
  call: string;
  whatsapp: string;
  map: string;
}

/**
 * Qatar addresses use the blue plate: zone, street and building numbers.
 * The map link searches for that address; riders can also type it in the
 * official Qatar maps app.
 */
export function addressLine(
  stop: Pick<RiderStop, "zoneId" | "street" | "building" | "unit">,
): string {
  const zone = findZone(stop.zoneId)?.name.en ?? stop.zoneId;
  return [
    stop.unit && `Unit ${stop.unit}`,
    `Building ${stop.building}`,
    `Street ${stop.street}`,
    zone,
  ]
    .filter(Boolean)
    .join(", ");
}

export function stopLinks(stop: RiderStop): StopLinks {
  return {
    call: `tel:+974${stop.phone}`,
    whatsapp: `https://wa.me/974${stop.phone}`,
    map: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${addressLine(stop)}, Qatar`)}`,
  };
}

/** Oldest pick-up first: the food that has waited longest is delivered first. */
export function sortStops(stops: readonly RiderStop[]): RiderStop[] {
  return [...stops].sort((a, b) => a.pickedUpAt.localeCompare(b.pickedUpAt));
}
