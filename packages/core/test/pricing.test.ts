import { describe, expect, it } from "vitest";
import { cartTotals, findZone, MENU, ORIGINS, ZONES } from "../src";

const westBay = findZone("west-bay")!;

describe("basket totals", () => {
  it("adds the zone delivery fee under the free-delivery threshold", () => {
    const t = cartTotals([{ dishId: "jollof", qty: 1 }], westBay);
    expect(t).toEqual({ subtotal: 45, delivery: 10, total: 55, missingForMinimum: 0 });
  });

  it("delivers for free from 120 QAR", () => {
    expect(cartTotals([{ dishId: "feast", qty: 1 }], westBay).delivery).toBe(0);
  });

  it("reports what is missing to reach the minimum order", () => {
    expect(cartTotals([{ dishId: "bissap", qty: 1 }], westBay).missingForMinimum).toBe(26);
  });

  it("rejects unknown dishes and bad quantities", () => {
    expect(() => cartTotals([{ dishId: "pizza", qty: 1 }], westBay)).toThrow(/Unknown dish/);
    expect(() => cartTotals([{ dishId: "jollof", qty: 0 }], westBay)).toThrow(/Invalid quantity/);
  });
});

describe("menu data", () => {
  it("has unique ids, a known origin and both languages for every dish", () => {
    expect(new Set(MENU.map((d) => d.id)).size).toBe(MENU.length);
    for (const d of MENU) {
      expect(ORIGINS[d.origin], d.id).toBeDefined();
      expect(d.name.en && d.name.ar && d.description.en && d.description.ar, d.id).toBeTruthy();
    }
  });

  it("has unique zone ids", () => {
    expect(new Set(ZONES.map((z) => z.id)).size).toBe(ZONES.length);
  });
});
