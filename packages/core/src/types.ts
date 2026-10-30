/** The three culinary regions. The menu rotates one region per day. */
export type Region = "west" | "east" | "north";

export type Section = "mains" | "sides" | "drinks" | "desserts" | "combos";

export type Lang = "en" | "ar";

/** Text in every language the app supports. */
export type Localized = Record<Lang, string>;

export interface Dish {
  id: string;
  section: Section;
  /** "all" is used for combos that mix several regions. */
  region: Region | "all";
  /** ISO-like country/area key, see ORIGINS in menu.ts. */
  origin: string;
  /** Price in QAR. PLACEHOLDER until mozde confirms real prices. */
  price: number;
  /**
   * true for slow-cooked dishes of the day: only sold on their region's day,
   * in limited portions (see config.ts PORTIONS_PER_DAY).
   * false for the fixed menu, available every day.
   */
  dailySpecial: boolean;
  spicy: boolean;
  tags: Array<"best" | "fish" | "nuts" | "veg">;
  name: Localized;
  description: Localized;
}

/** A calendar day in Qatar, written YYYY-MM-DD. */
export type IsoDate = string;

export interface CartLine {
  dishId: string;
  qty: number;
}
