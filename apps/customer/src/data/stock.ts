/**
 * Where the app reads how many portions are already sold.
 *
 * With Supabase configured it reads the daily_stock counters (refreshed every
 * minute by the home screen); otherwise nothing is sold (demo).
 */
import { soldAgainstDefault, type IsoDate } from "@jollofco/core";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "./supabase";

export interface StockSource {
  /** Portions sold or pre-ordered, by dish id, for one day. */
  soldOn(date: IsoDate): Promise<Record<string, number>>;
}

export const placeholderStock: StockSource = {
  async soldOn() {
    return {};
  },
};

export function supabaseStock(client: SupabaseClient): StockSource {
  return {
    async soldOn(date) {
      const { data, error } = await client
        .from("daily_stock")
        .select("dish_id, sold, portions")
        .eq("delivery_date", date);
      if (error) throw error;
      return Object.fromEntries(
        data.map((r) => [r.dish_id as string, soldAgainstDefault(r.sold, r.portions)]),
      );
    },
  };
}

export const stockSource: StockSource = supabase ? supabaseStock(supabase) : placeholderStock;
