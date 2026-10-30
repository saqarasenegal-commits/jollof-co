import { describe, expect, it } from "vitest";
import { canTransition, nextStatus, prepList, sortTickets, type KitchenOrder } from "../src";

const MON = "2026-11-02";
const order = (o: Partial<KitchenOrder>): KitchenOrder => ({
  id: o.number ?? "x",
  number: "JC-0",
  deliveryDate: MON,
  slot: "asap",
  createdAt: "2026-11-02T09:00:00Z",
  status: "received",
  customerName: "A",
  zoneId: "west-bay",
  lines: [],
  ...o,
});

describe("order statuses", () => {
  it("moves forward one step at a time", () => {
    expect(nextStatus("received")).toBe("cooking");
    expect(nextStatus("cooking")).toBe("on_the_way");
    expect(nextStatus("on_the_way")).toBe("delivered");
    expect(nextStatus("delivered")).toBeUndefined();
    expect(canTransition("received", "delivered")).toBe(false);
  });

  it("allows cancelling only before the rider leaves", () => {
    expect(canTransition("cooking", "cancelled")).toBe(true);
    expect(canTransition("on_the_way", "cancelled")).toBe(false);
  });
});

describe("kitchen tickets", () => {
  it("shows ASAP orders first, then slots, finished last", () => {
    const sorted = sortTickets([
      order({ number: "slot-late", slot: "19:00-20:00" }),
      order({ number: "done", status: "delivered", createdAt: "2026-11-02T08:00:00Z" }),
      order({ number: "asap-2", createdAt: "2026-11-02T09:10:00Z" }),
      order({ number: "slot-early", slot: "12:00-13:00" }),
      order({ number: "asap-1", createdAt: "2026-11-02T09:05:00Z" }),
    ]);
    expect(sorted.map((o) => o.number)).toEqual([
      "asap-1",
      "asap-2",
      "slot-early",
      "slot-late",
      "done",
    ]);
  });
});

describe("prep list", () => {
  it("adds up portions per dish for the day, without cancelled orders", () => {
    const list = prepList(
      [
        order({
          lines: [
            { dishId: "jollof", qty: 2 },
            { dishId: "bissap", qty: 1 },
          ],
        }),
        order({ status: "cooking", lines: [{ dishId: "jollof", qty: 1 }] }),
        order({ status: "cancelled", lines: [{ dishId: "jollof", qty: 5 }] }),
        order({ deliveryDate: "2026-11-03", lines: [{ dishId: "jollof", qty: 9 }] }),
      ],
      MON,
    );
    expect(list).toEqual([
      { dishId: "jollof", toCook: 2, total: 3 },
      { dishId: "bissap", toCook: 1, total: 1 },
    ]);
  });
});
