/**
 * The place-order HTTP endpoint, as a plain (Request) => Response function so it
 * runs on Supabase Edge Functions (supabase/functions/place-order) and in tests.
 *
 * POST an OrderRequest as JSON; the answer is the customer app's PlaceResult.
 */
import type { OrderRequest } from "@jollofco/core";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SupabaseOrderStore } from "./db";
import { paymentProviderFromEnv } from "./payments";
import { placeOrder, type Services } from "./placeOrder";
import { messageProviderFromEnv } from "./sms";

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "content-type, authorization, apikey, x-client-info",
  "access-control-allow-methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "content-type": "application/json" },
  });
}

/**
 * Real services. `client` must use the service-role key (server only): the edge
 * function creates it, so this package stays free of runtime-specific imports.
 */
export function servicesFor(
  client: SupabaseClient,
  env: Record<string, string | undefined>,
): Services {
  return {
    store: new SupabaseOrderStore(client),
    payments: paymentProviderFromEnv(env),
    messages: messageProviderFromEnv(env),
  };
}

export async function handleOrderRequest(
  request: Request,
  services: Services,
  now = new Date(),
): Promise<Response> {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (request.method !== "POST") return json({ ok: false, errors: ["network"] }, 405);

  let body: OrderRequest;
  try {
    body = (await request.json()) as OrderRequest;
  } catch {
    return json({ ok: false, errors: ["network"] }, 400);
  }

  try {
    const result = await placeOrder(body, now, services);
    if (!result.ok) return json(result, 422);
    // The app only needs the number, total and (for card payments) where to pay.
    const { number, total, paymentUrl } = result;
    return json({ ok: true, number, total, paymentUrl });
  } catch (e) {
    // Malformed request or database down: log it, never show internals to the customer.
    console.error("place-order failed", e);
    return json({ ok: false, errors: ["network"] }, 500);
  }
}
