/**
 * Sends orders to the server.
 *
 * Until the Supabase backend is deployed, `demoOrders` checks the order with the
 * same rules as the server and pretends to save it. Swap it for `httpOrders`
 * (pointing at the place-order function) without touching the screens.
 */
import { validateOrder, type OrderError, type OrderRequest } from "@jollofco/core";

export type PlaceResult =
  | { ok: true; number: string; total: number; paymentUrl?: string }
  | { ok: false; errors: Array<OrderError | "payment-failed" | "network"> };

export interface OrderApi {
  place(req: OrderRequest): Promise<PlaceResult>;
}

let demoCounter = 1000;

export const demoOrders: OrderApi = {
  async place(req) {
    const check = validateOrder(req, new Date());
    if (!check.ok) return check;
    demoCounter += 1;
    return { ok: true, number: `JC-${demoCounter}`, total: check.totals.total };
  },
};

/** Calls the server endpoint. `url` comes from app config (EXPO_PUBLIC_ORDER_API_URL). */
export function httpOrders(url: string): OrderApi {
  return {
    async place(req) {
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(req),
        });
        return (await res.json()) as PlaceResult;
      } catch {
        return { ok: false, errors: ["network"] };
      }
    },
  };
}

export const orderApi: OrderApi = process.env.EXPO_PUBLIC_ORDER_API_URL
  ? httpOrders(process.env.EXPO_PUBLIC_ORDER_API_URL)
  : demoOrders;
