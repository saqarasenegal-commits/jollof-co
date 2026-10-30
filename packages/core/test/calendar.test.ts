import { describe, expect, it } from "vitest";
import {
  addDays,
  canOrderFor,
  dishesOfTheDay,
  findDish,
  isServedOn,
  menuFor,
  nextDaysForRegion,
  orderableDays,
  preorderDeadline,
  qatarInstant,
  regionAction,
  regionOfDay,
  toQatarTime,
} from "../src";

// Week of Sunday 1 to Saturday 7 November 2026.
const SUN = "2026-11-01";
const MON = "2026-11-02";
const TUE = "2026-11-03";
const WED = "2026-11-04";
const THU = "2026-11-05";
const FRI = "2026-11-06";
const SAT = "2026-11-07";

const ids = (dishes: { id: string }[]) => dishes.map((d) => d.id).sort();

describe("rotation: one region per day", () => {
  it("follows the validated weekly plan", () => {
    expect([SUN, MON, TUE, WED, THU, FRI, SAT].map(regionOfDay)).toEqual([
      "east",
      "west",
      "east",
      "north",
      "west",
      "north",
      "west",
    ]);
  });

  it("serves all slow-cooked dishes of the region of the day", () => {
    expect(ids(dishesOfTheDay(MON))).toEqual(["jollof", "mafe", "thieb"]);
    expect(ids(dishesOfTheDay(TUE))).toEqual(["doro", "pilau"]);
    expect(ids(dishesOfTheDay(WED))).toEqual(["couscous", "tagine-c", "tagine-l"]);
  });

  it("keeps the fixed menu every day and hides other regions' dishes of the day", () => {
    const yassa = findDish("yassa")!;
    const doro = findDish("doro")!;
    for (const day of [SUN, MON, TUE, WED, THU, FRI, SAT])
      expect(isServedOn(yassa, day)).toBe(true);
    expect(isServedOn(doro, MON)).toBe(false);
    expect(menuFor(MON).some((d) => d.id === "doro")).toBe(false);
    expect(menuFor(MON).some((d) => d.id === "nyama")).toBe(true);
  });

  it("finds the next days of a region", () => {
    expect(nextDaysForRegion("north", MON, 2)).toEqual([WED, FRI]);
  });
});

describe("Qatar time", () => {
  it("converts UTC to the Doha date (UTC+3)", () => {
    // 22:30 UTC on Sunday = 01:30 Monday in Doha
    expect(toQatarTime(new Date("2026-11-01T22:30:00Z"))).toEqual({
      date: MON,
      weekday: 1,
      hour: 1,
      minute: 30,
    });
  });

  it("adds days across month ends", () => {
    expect(addDays("2026-10-31", 1)).toBe(SUN);
    expect(addDays(SUN, -1)).toBe("2026-10-31");
  });
});

describe("ordering windows", () => {
  it("closes pre-orders at 22:00 the day before", () => {
    expect(preorderDeadline(TUE).toISOString()).toBe("2026-11-02T19:00:00.000Z");
  });

  it("offers today and tomorrow during service before 22:00", () => {
    expect(orderableDays(qatarInstant(MON, 13))).toEqual([
      { date: MON, kind: "today" },
      { date: TUE, kind: "preorder" },
    ]);
  });

  it("stops tomorrow's pre-orders at 22:00 sharp", () => {
    expect(canOrderFor(TUE, qatarInstant(MON, 21, 59))?.kind).toBe("preorder");
    expect(canOrderFor(TUE, qatarInstant(MON, 22, 0))).toBeUndefined();
  });

  it("allows only pre-orders before opening time", () => {
    expect(orderableDays(qatarInstant(MON, 8))).toEqual([{ date: TUE, kind: "preorder" }]);
  });
});

describe("home page region cards", () => {
  it("offers today's region for same-day delivery", () => {
    expect(regionAction("west", qatarInstant(MON, 13))).toEqual({ kind: "today", date: MON });
  });

  it("offers tomorrow's region as a pre-order", () => {
    expect(regionAction("east", qatarInstant(MON, 13))).toEqual({ kind: "preorder", date: TUE });
  });

  it("tells when pre-orders open for other regions", () => {
    expect(regionAction("north", qatarInstant(MON, 13))).toEqual({
      kind: "opensOn",
      date: WED,
      opensOn: TUE,
    });
  });

  it("moves to the next occurrence after the cut-off", () => {
    // Monday 23:00: kitchen closed, Tuesday pre-orders closed. East is next served on Sunday 8th.
    expect(regionAction("east", qatarInstant(MON, 23))).toEqual({
      kind: "opensOn",
      date: "2026-11-08",
      opensOn: SAT,
    });
  });
});
