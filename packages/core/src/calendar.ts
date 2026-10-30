/**
 * Which dishes are served on which day, and when customers may order.
 *
 * Every function takes the current time as an argument (never reads the clock
 * itself) so the rules are easy to test for any day and hour.
 */
import { OPENING_HOURS, PREORDER_CUTOFF, PREORDER_DAYS_AHEAD, ROTATION, TIMEZONE } from "./config";
import { MENU } from "./menu";
import type { Dish, IsoDate, Region } from "./types";

/** Qatar is UTC+3 all year (no daylight saving), which keeps date maths simple. */
const QATAR_UTC_OFFSET_HOURS = 3;

export interface QatarTime {
  date: IsoDate;
  /** 0 = Sunday … 6 = Saturday */
  weekday: number;
  hour: number;
  minute: number;
}

const formatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** Converts an instant to the calendar date and clock time in Doha. */
export function toQatarTime(instant: Date): QatarTime {
  const parts = Object.fromEntries(formatter.formatToParts(instant).map((p) => [p.type, p.value]));
  const date = `${parts.year}-${parts.month}-${parts.day}`;
  return {
    date,
    weekday: weekdayOf(date),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
  };
}

export function weekdayOf(date: IsoDate): number {
  return new Date(`${date}T12:00:00Z`).getUTCDay();
}

export function addDays(date: IsoDate, days: number): IsoDate {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** The instant a given Qatar date and time happens. */
export function qatarInstant(date: IsoDate, hour: number, minute = 0): Date {
  const [y, m, d] = date.split("-").map(Number) as [number, number, number];
  return new Date(Date.UTC(y, m - 1, d, hour - QATAR_UTC_OFFSET_HOURS, minute));
}

/** Region whose slow-cooked dishes are served on this date. */
export function regionOfDay(date: IsoDate): Region {
  return ROTATION[weekdayOf(date)]!;
}

/** Slow-cooked dishes of the day (limited portions). */
export function dishesOfTheDay(date: IsoDate): Dish[] {
  const region = regionOfDay(date);
  return MENU.filter((d) => d.dailySpecial && d.region === region);
}

/** Fixed-menu dishes are sold every day; dishes of the day only on their region's day. */
export function isServedOn(dish: Dish, date: IsoDate): boolean {
  return !dish.dailySpecial || dish.region === regionOfDay(date);
}

/** Everything that can be ordered for delivery on this date. */
export function menuFor(date: IsoDate): Dish[] {
  return MENU.filter((d) => isServedOn(d, date));
}

/** Next dates (from `from`, included) when a region is served. */
export function nextDaysForRegion(region: Region, from: IsoDate, count = 3): IsoDate[] {
  const days: IsoDate[] = [];
  for (let i = 0; days.length < count && i < 7 * count; i++) {
    const date = addDays(from, i);
    if (regionOfDay(date) === region) days.push(date);
  }
  return days;
}

/** Pre-orders for `date` close at the cut-off time on the day before. */
export function preorderDeadline(date: IsoDate): Date {
  return qatarInstant(addDays(date, -1), PREORDER_CUTOFF.hour, PREORDER_CUTOFF.minute);
}

export function isKitchenOpen(now: Date): boolean {
  const { hour, minute } = toQatarTime(now);
  const t = hour * 60 + minute;
  const { open, close } = OPENING_HOURS;
  return t >= open.hour * 60 + open.minute && t < close.hour * 60 + close.minute;
}

export type OrderKind = "today" | "preorder";

export interface OrderableDay {
  date: IsoDate;
  kind: OrderKind;
}

/**
 * Days a customer can order for right now:
 * - today, while the kitchen is open;
 * - the next day(s), as a pre-order, until the cut-off the day before.
 */
export function orderableDays(now: Date): OrderableDay[] {
  const today = toQatarTime(now).date;
  const days: OrderableDay[] = [];
  if (isKitchenOpen(now)) days.push({ date: today, kind: "today" });
  for (let i = 1; i <= PREORDER_DAYS_AHEAD; i++) {
    const date = addDays(today, i);
    if (now < preorderDeadline(date)) days.push({ date, kind: "preorder" });
  }
  return days;
}

export function canOrderFor(date: IsoDate, now: Date): OrderableDay | undefined {
  return orderableDays(now).find((d) => d.date === date);
}

export type RegionAction =
  | { kind: "today"; date: IsoDate }
  | { kind: "preorder"; date: IsoDate }
  /** Not orderable yet: pre-orders for `date` open on `opensOn` (the day before). */
  | { kind: "opensOn"; date: IsoDate; opensOn: IsoDate };

/** What the home page button of a region card offers right now. */
export function regionAction(region: Region, now: Date): RegionAction {
  for (const day of orderableDays(now)) {
    if (regionOfDay(day.date) === region) return day;
  }
  const today = toQatarTime(now).date;
  const next = nextDaysForRegion(region, addDays(today, 1), 7).find(
    (date) => now < preorderDeadline(date) || date > addDays(today, 1),
  )!;
  return { kind: "opensOn", date: next, opensOn: addDays(next, -1) };
}
