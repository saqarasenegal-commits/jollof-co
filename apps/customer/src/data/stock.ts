/**
 * Where the app reads how many portions are already sold.
 *
 * For now this is an in-memory placeholder (nothing sold). Phase 3 replaces it
 * with a Supabase query + realtime subscription, without touching the screens.
 */
import type { IsoDate } from "@jollofco/core";

export interface StockSource {
  /** Portions sold or pre-ordered, by dish id, for one day. */
  soldOn(date: IsoDate): Promise<Record<string, number>>;
}

export const placeholderStock: StockSource = {
  async soldOn() {
    return {};
  },
};
