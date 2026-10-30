/**
 * Where the app reads live prices and which dishes are on the menu.
 *
 * Dish names, descriptions and photos ship with the app (packages/core MENU).
 * The admin changes prices and switches dishes on/off in the database; the app
 * applies those with applyMenuUpdates. Without Supabase the bundled menu is used.
 */
import { MENU, type DishUpdate } from "@jollofco/core";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "./supabase";

export interface MenuSource {
  updates(): Promise<DishUpdate[]>;
}

export const bundledMenu: MenuSource = {
  async updates() {
    return [];
  },
};

export function supabaseMenu(client: SupabaseClient): MenuSource {
  return {
    async updates() {
      const { data, error } = await client.from("dishes").select("id, price_qar");
      if (error) throw error;
      // An empty table means the menu was never loaded: keep the bundled one.
      if (data.length === 0) return [];
      // RLS only returns dishes on the menu, so a dish missing here is switched off.
      const prices = new Map(data.map((r) => [r.id as string, Number(r.price_qar)]));
      return MENU.map((d) => ({
        id: d.id,
        price: prices.get(d.id) ?? d.price,
        active: prices.has(d.id),
      }));
    },
  };
}

export const menuSource: MenuSource = supabase ? supabaseMenu(supabase) : bundledMenu;
