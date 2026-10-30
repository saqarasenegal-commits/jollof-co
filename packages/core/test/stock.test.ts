import { describe, expect, it } from "vitest";
import { canReserve, findDish, isSoldOut, portionsLeft, PORTIONS_PER_DAY } from "../src";

const jollof = findDish("jollof")!;
const yassa = findDish("yassa")!;

describe("limited portions", () => {
  it("starts each dish of the day at 40 portions", () => {
    expect(PORTIONS_PER_DAY).toBe(40);
    expect(portionsLeft(jollof, 0)).toBe(40);
  });

  it("counts down and shows sold out at zero", () => {
    expect(portionsLeft(jollof, 38)).toBe(2);
    expect(isSoldOut(jollof, 38)).toBe(false);
    expect(isSoldOut(jollof, 40)).toBe(true);
    expect(portionsLeft(jollof, 45)).toBe(0);
  });

  it("refuses an order bigger than what is left", () => {
    expect(canReserve(jollof, 38, 2)).toBe(true);
    expect(canReserve(jollof, 38, 3)).toBe(false);
    expect(canReserve(jollof, 0, 0)).toBe(false);
  });

  it("never limits the fixed menu", () => {
    expect(portionsLeft(yassa, 500)).toBeNull();
    expect(isSoldOut(yassa, 500)).toBe(false);
    expect(canReserve(yassa, 500, 10)).toBe(true);
  });
});
