/**
 * Where the admin screens read and save data.
 *
 * `demoAdmin` keeps everything in memory, starting from the menu in packages/core.
 * The Supabase version calls `update_dish` and `set_portions` (supabase/migrations)
 * and implements the same interface.
 */
import { DEFAULT_PORTIONS, MENU, type Dish, type IsoDate } from "@jollofco/core";

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
