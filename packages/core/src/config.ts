/**
 * Business settings. Everything mozde may want to change lives here, so a
 * developer never has to hunt through the code.
 *
 * Values marked PLACEHOLDER are not confirmed yet.
 */
import type { Region } from "./types";

/** All dates and cut-off times are computed in Qatar time (UTC+3, no daylight saving). */
export const TIMEZONE = "Asia/Qatar";

/**
 * Region of the day, by weekday. Index 0 = Sunday (same as Date.getDay()).
 * Validated by mozde on 2026-10-22: Mon West, Tue East, Wed North, Thu West,
 * Fri North, Sat West, Sun East.
 */
export const ROTATION: readonly Region[] = [
  "east", // Sunday
  "west", // Monday
  "east", // Tuesday
  "north", // Wednesday
  "west", // Thursday
  "north", // Friday
  "west", // Saturday
];

/** Portions cooked per dish of the day. Validated by mozde: 40. */
export const PORTIONS_PER_DAY = 40;

/** Pre-orders for tomorrow close at this time, the day before (Qatar time). Validated: 22:00. */
export const PREORDER_CUTOFF = { hour: 22, minute: 0 };

/** How many days ahead customers can pre-order. Validated: next day only. */
export const PREORDER_DAYS_AHEAD = 1;

/** Opening hours for same-day delivery. PLACEHOLDER. */
export const OPENING_HOURS = { open: { hour: 11, minute: 0 }, close: { hour: 23, minute: 0 } };

/** Minimum basket in QAR. PLACEHOLDER. */
export const MIN_ORDER_QAR = 40;

/** Delivery is free from this basket amount in QAR. PLACEHOLDER. */
export const FREE_DELIVERY_FROM_QAR = 120;

/** WhatsApp contact number. PLACEHOLDER: mozde has not given it yet. */
export const WHATSAPP_NUMBER = "+974 0000 0000";
