// Supabase Edge Function (Deno): the customer app posts orders here.
// The logic lives in packages/server (tested with Vitest); `npm run fn:build`
// bundles it into ./bundle.js. Deploy: see supabase/functions/README.md.
import { createClient } from "npm:@supabase/supabase-js@2.118.0";
import { handleOrderRequest, servicesFor } from "./bundle.js";

// Both are set by Supabase for every edge function; never put them in the app.
const client = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } },
);
const services = servicesFor(client, Deno.env.toObject());

Deno.serve((request) => handleOrderRequest(request, services));
