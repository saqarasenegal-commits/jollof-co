/**
 * Admin rules: editing prices, turning dishes on and off, and changing the
 * number of portions for a given day. The database enforces the same limits.
 */
import { PORTIONS_PER_DAY } from "./config";

/** Highest price accepted, to catch typing mistakes (an extra zero). */
export const MAX_PRICE_QAR = 1000;
/** Highest number of portions a day, for the same reason. */
export const MAX_PORTIONS = 500;

export type PriceError = "not-a-number" | "negative" | "too-many-decimals" | "too-high";

/** Parses a price typed by the admin ("45", "45.5", "45,50"). */
export function parsePrice(
  input: string,
): { ok: true; value: number } | { ok: false; error: PriceError } {
  const text = input.trim().replace(",", ".");
  if (!/^-?\d+(\.\d+)?$/.test(text)) return { ok: false, error: "not-a-number" };
  const value = Number(text);
  if (value < 0) return { ok: false, error: "negative" };
  if (!/^\d+(\.\d{1,2})?$/.test(text)) return { ok: false, error: "too-many-decimals" };
  if (value > MAX_PRICE_QAR) return { ok: false, error: "too-high" };
  return { ok: true, value };
}

export type PortionsError = "not-a-number" | "below-sold" | "too-high";

/**
 * New number of portions for a dish on a day. It can't go below what is
 * already sold, otherwise confirmed orders would have no food.
 */
export function checkPortions(
  input: string,
  alreadySold: number,
): { ok: true; value: number } | { ok: false; error: PortionsError } {
  const text = input.trim();
  if (!/^\d+$/.test(text)) return { ok: false, error: "not-a-number" };
  const value = Number(text);
  if (value < alreadySold) return { ok: false, error: "below-sold" };
  if (value > MAX_PORTIONS) return { ok: false, error: "too-high" };
  return { ok: true, value };
}

export const DEFAULT_PORTIONS = PORTIONS_PER_DAY;
