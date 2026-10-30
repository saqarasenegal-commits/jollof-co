import { describe, expect, it } from "vitest";
import { checkPortions, parsePrice } from "../src";

describe("admin: prices", () => {
  it("accepts whole and decimal prices, with a dot or a comma", () => {
    expect(parsePrice("45")).toEqual({ ok: true, value: 45 });
    expect(parsePrice(" 45,50 ")).toEqual({ ok: true, value: 45.5 });
  });

  it("refuses mistakes", () => {
    expect(parsePrice("abc")).toEqual({ ok: false, error: "not-a-number" });
    expect(parsePrice("-5")).toEqual({ ok: false, error: "negative" });
    expect(parsePrice("4.555")).toEqual({ ok: false, error: "too-many-decimals" });
    expect(parsePrice("4500")).toEqual({ ok: false, error: "too-high" });
  });
});

describe("admin: portions per day", () => {
  it("accepts more or fewer portions", () => {
    expect(checkPortions("60", 10)).toEqual({ ok: true, value: 60 });
    expect(checkPortions("10", 10)).toEqual({ ok: true, value: 10 });
  });

  it("never goes below what is already sold", () => {
    expect(checkPortions("9", 10)).toEqual({ ok: false, error: "below-sold" });
    expect(checkPortions("4.5", 0)).toEqual({ ok: false, error: "not-a-number" });
    expect(checkPortions("900", 0)).toEqual({ ok: false, error: "too-high" });
  });
});
