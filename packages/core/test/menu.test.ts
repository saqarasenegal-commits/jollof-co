import { afterEach, describe, expect, it } from "vitest";
import {
  applyMenuUpdates,
  cartSubtotal,
  changeCartDay,
  currentMenu,
  findDish,
  MENU,
  menuFor,
} from "../src";

afterEach(() => applyMenuUpdates([]));

describe("live menu updates", () => {
  it("uses the bundled menu until updates arrive", () => {
    expect(currentMenu()).toEqual(MENU);
  });

  it("applies the admin's price everywhere", () => {
    applyMenuUpdates([{ id: "bissap", price: 16, active: true }]);
    expect(findDish("bissap")?.price).toBe(16);
    expect(cartSubtotal([{ dishId: "bissap", qty: 2 }])).toBe(32);
  });

  it("hides dishes switched off", () => {
    applyMenuUpdates([{ id: "jollof", price: 45, active: false }]);
    expect(findDish("jollof")).toBeUndefined();
    expect(menuFor("2026-11-02").map((d) => d.id)).not.toContain("jollof");
  });

  it("keeps dishes the database doesn't list", () => {
    applyMenuUpdates([{ id: "bissap", price: 16, active: true }]);
    expect(findDish("yassa")?.price).toBe(48);
  });

  it("lets the app drop switched-off dishes from a basket", () => {
    const cart = {
      date: "2026-11-02",
      lines: [
        { dishId: "jollof", qty: 1 },
        { dishId: "bissap", qty: 1 },
      ],
    };
    applyMenuUpdates([{ id: "jollof", price: 45, active: false }]);
    expect(changeCartDay(cart, cart.date)).toEqual({
      cart: { date: "2026-11-02", lines: [{ dishId: "bissap", qty: 1 }] },
      removed: ["jollof"],
    });
  });
});
