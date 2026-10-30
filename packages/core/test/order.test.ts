import { describe, expect, it } from "vitest";
import { normalizeQatarMobile, qatarInstant, validateOrder, type OrderRequest } from "../src";

const MON = "2026-11-02"; // West day
const TUE = "2026-11-03"; // East day
const noon = qatarInstant(MON, 12);

const base: OrderRequest = {
  cart: { date: MON, lines: [{ dishId: "jollof", qty: 1 }] },
  name: "Aïssatou",
  phone: "+974 5555 1234",
  address: { zoneId: "west-bay", street: "850", building: "12", unit: "3" },
  slot: "asap",
  payment: "card",
};

const errorsOf = (req: OrderRequest, now = noon, sold?: Record<string, number>) => {
  const r = validateOrder(req, now, sold);
  return r.ok ? [] : r.errors;
};

describe("phone numbers", () => {
  it("accepts Qatar mobiles in any common format", () => {
    expect(normalizeQatarMobile("+974 5555 1234")).toBe("55551234");
    expect(normalizeQatarMobile("3312-4567")).toBe("33124567");
  });

  it("rejects landlines and wrong lengths", () => {
    expect(normalizeQatarMobile("4444 1234")).toBeNull();
    expect(normalizeQatarMobile("5555 123")).toBeNull();
  });
});

describe("order validation", () => {
  it("accepts a correct same-day order and returns totals", () => {
    expect(validateOrder(base, noon)).toEqual({
      ok: true,
      kind: "today",
      phone: "55551234",
      totals: { subtotal: 45, delivery: 10, total: 55, missingForMinimum: 0 },
    });
  });

  it("lists every problem at once", () => {
    const req = {
      ...base,
      name: " ",
      phone: "123",
      address: { zoneId: "mars", street: "abc", building: "" },
    };
    expect(errorsOf(req)).toEqual([
      "name-missing",
      "phone-invalid",
      "zone-unknown",
      "address-invalid",
    ]);
  });

  it("enforces the minimum order", () => {
    const req = { ...base, cart: { date: MON, lines: [{ dishId: "bissap", qty: 1 }] } };
    expect(errorsOf(req)).toEqual(["below-minimum"]);
  });

  it("refuses sold-out dishes", () => {
    expect(errorsOf(base, noon, { jollof: 40 })).toEqual(["dish-unavailable"]);
  });

  it("needs a slot at least an hour ahead for same-day scheduling", () => {
    expect(errorsOf({ ...base, slot: "12:00-13:00" })).toEqual(["slot-invalid"]);
    expect(errorsOf({ ...base, slot: "13:00-14:00" }, qatarInstant(MON, 12, 1))).toEqual([
      "slot-invalid",
    ]);
    expect(errorsOf({ ...base, slot: "13:00-14:00" })).toEqual([]);
  });

  describe("pre-orders", () => {
    const pre: OrderRequest = {
      ...base,
      cart: { date: TUE, lines: [{ dishId: "doro", qty: 1 }] },
      slot: "12:00-13:00",
    };

    it("accepts a pre-order with a slot before 22:00 the day before", () => {
      const r = validateOrder(pre, qatarInstant(MON, 21, 30));
      expect(r.ok && r.kind).toBe("preorder");
    });

    it("refuses it after the cut-off", () => {
      expect(errorsOf(pre, qatarInstant(MON, 22))).toEqual(["day-closed"]);
    });

    it("needs a slot and card or Apple Pay", () => {
      expect(errorsOf({ ...pre, slot: "asap", payment: "cash" })).toEqual([
        "slot-invalid",
        "cash-not-for-preorder",
      ]);
    });
  });
});
