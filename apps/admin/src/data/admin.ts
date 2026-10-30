/**
 * Where the admin screens read and save data.
 *
 * `supabaseAdmin` reads the dishes and daily stock and calls `update_dish` and
 * `set_portions` (supabase/migrations). `demoAdmin` keeps everything in memory,
 * starting from the menu in packages/core. Same interface for both.
 */
import { DEFAULT_PORTIONS, MENU, type Dish, type IsoDate } from "@jollofco/core";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface DayStock {
  dishId: string;
  portions: number;
  sold: number;
}

export interface AdminSource {
  dishes(): Promise<Array<Dish & { active: boolean }>>;
  updateDish(id: string, change: { price?: number; active?: boolean }): Promise<void>;
  stockOn(date: IsoDate, dishIds: string[]): Promise<DayStock[]>;
  setPortions(date: IsoDate, dishId: string, portions: number): Promise<void>;
}

export function demoAdmin(): AdminSource {
  const dishes = MENU.map((d) => ({ ...d, active: true }));
  const stock = new Map<string, DayStock>();
  const key = (date: IsoDate, id: string) => `${date}/${id}`;

  return {
    async dishes() {
      return dishes.map((d) => ({ ...d }));
    },
    async updateDish(id, change) {
      const d = dishes.find((x) => x.id === id);
      if (!d) throw new Error(`Unknown dish ${id}`);
      if (change.price !== undefined) d.price = change.price;
      if (change.active !== undefined) d.active = change.active;
    },
    async stockOn(date, dishIds) {
      return dishIds.map(
        (id) => stock.get(key(date, id)) ?? { dishId: id, portions: DEFAULT_PORTIONS, sold: 0 },
      );
    },
    async setPortions(date, dishId, portions) {
      const current = stock.get(key(date, dishId)) ?? {
        dishId,
        portions: DEFAULT_PORTIONS,
        sold: 0,
      };
      stock.set(key(date, dishId), { ...current, portions });
    },
  };
}

/** Needs a signed-in admin (the SQL functions check the role). */
export function supabaseAdmin(client: SupabaseClient): AdminSource {
  async function rpc(name: string, args: Record<string, unknown>) {
    const { error } = await client.rpc(name, args);
    if (error) throw new Error(error.message);
  }

  return {
    async dishes() {
      // Names and descriptions ship with the apps; the database holds price and on/off.
      const { data, error } = await client.from("dishes").select("id, price_qar, active");
      if (error) throw error;
      const live = new Map(data.map((r) => [r.id as string, r]));
      return MENU.filter((d) => live.has(d.id)).map((d) => ({
        ...d,
        price: Number(live.get(d.id)!.price_qar),
        active: live.get(d.id)!.active as boolean,
      }));
    },
    updateDish: (id, change) =>
      rpc("update_dish", {
        p_dish_id: id,
        p_price_qar: change.price ?? null,
        p_active: change.active ?? null,
      }),
    async stockOn(date, dishIds) {
      const { data, error } = await client
        .from("daily_stock")
        .select("dish_id, portions, sold")
        .eq("delivery_date", date)
        .in("dish_id", dishIds);
      if (error) throw error;
      const rows = new Map(data.map((r) => [r.dish_id as string, r]));
      return dishIds.map((id) => {
        const r = rows.get(id);
        return r
          ? { dishId: id, portions: r.portions, sold: r.sold }
          : { dishId: id, portions: DEFAULT_PORTIONS, sold: 0 };
      });
    },
    setPortions: (date, dishId, portions) =>
      rpc("set_portions", { p_date: date, p_dish_id: dishId, p_portions: portions }),
  };
}
