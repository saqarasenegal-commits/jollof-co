import { describe, expect, it } from "vitest";
import { addToCart, cartCount, changeCartDay, type Cart } from "../src";

const MON = "2026-11-02"; // West day
const TUE = "2026-11-03"; // East day
const empty: Cart = { date: MON, lines: [] };

function add(cart: Cart, id: string, qty: number, sold?: Record<string, number>): Cart {
  const r = addToCart(cart, id, qty, sold);
  if (!r.ok) throw new Error(r.reason);
  return r.cart;
}

describe("basket", () => {
  it("adds and removes dishes", () => {
    let cart = add(empty, "jollof", 2);
    cart = add(cart, "bissap", 1);
    expect(cartCount(cart)).toBe(3);
    cart = add(cart, "jollof", -2);
    expect(cart.lines).toEqual([{ dishId: "bissap", qty: 1 }]);
  });

  it("refuses a dish of the day on another region's day", () => {
    expect(addToCart(empty, "doro", 1)).toEqual({ ok: false, reason: "not-served-that-day" });
  });

  it("never goes over the portions left", () => {
    const cart = add(empty, "jollof", 1, { jollof: 38 });
    expect(addToCart(cart, "jollof", 1, { jollof: 38 }).ok).toBe(true);
    expect(addToCart(cart, "jollof", 2, { jollof: 38 })).toEqual({
      ok: false,
      reason: "not-enough-portions",
    });
  });

  it("drops dishes no longer served when the day changes", () => {
    const cart = add(add(empty, "jollof", 1), "yassa", 1);
    const moved = changeCartDay(cart, TUE);
    expect(moved.removed).toEqual(["jollof"]);
    expect(moved.cart).toEqual({ date: TUE, lines: [{ dishId: "yassa", qty: 1 }] });
  });
});
