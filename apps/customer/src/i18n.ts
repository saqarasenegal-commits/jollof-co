/**
 * All user-facing text, in English and Arabic.
 * Add a key to both languages; TypeScript fails the build if one is missing.
 */
import type { Lang, Region } from "@jollofco/core";

const en = {
  switchLanguage: "العربية",
  tagline: "Pan-African kitchen, delivered in Doha",
  todayRegion: (region: string) => `Today: ${region}`,
  regions: { west: "West Africa", east: "East Africa", north: "North Africa" } as Record<
    Region,
    string
  >,
  servedOn: "Slow-cooked on",
  orderToday: "Order today",
  preorderTomorrow: "Pre-order for tomorrow",
  preorderOpens: (day: string) => `Pre-order opens ${day}`,
  dishesOfTheDay: "Dishes of the day",
  fixedMenu: "Always on the menu",
  portionsLeft: (n: number) => `${n} left`,
  soldOut: "Sold out",
  qar: (n: number) => `QAR ${n}`,
  spicy: "Spicy",
};

type Strings = typeof en;

const ar: Strings = {
  switchLanguage: "English",
  tagline: "مطبخ أفريقي، يصلك في الدوحة",
  todayRegion: (region) => `اليوم: ${region}`,
  regions: { west: "غرب أفريقيا", east: "شرق أفريقيا", north: "شمال أفريقيا" },
  servedOn: "يُطهى ببطء يوم",
  orderToday: "اطلب اليوم",
  preorderTomorrow: "اطلب مسبقاً للغد",
  preorderOpens: (day) => `يفتح الطلب المسبق ${day}`,
  dishesOfTheDay: "أطباق اليوم",
  fixedMenu: "متوفر دائماً",
  portionsLeft: (n) => `بقي ${n}`,
  soldOut: "نفدت الكمية",
  qar: (n) => `${n} ر.ق`,
  spicy: "حار",
};

export const strings: Record<Lang, Strings> = { en, ar };

export const isRtl = (lang: Lang) => lang === "ar";

/** Weekday name of a YYYY-MM-DD date in the user's language. */
export function weekdayName(date: string, lang: Lang): string {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString(lang === "ar" ? "ar-QA" : "en-GB", {
    weekday: "long",
    timeZone: "UTC",
  });
}
