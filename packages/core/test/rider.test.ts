import { describe, expect, it } from "vitest";
import { addressLine, sortStops, stopLinks, type RiderStop } from "../src";

const stop: RiderStop = {
  orderId: "1",
  number: "JC-1001",
  customerName: "Omar",
  phone: "55551234",
  zoneId: "al-sadd",
  street: "850",
  building: "12",
  unit: "3",
  cashToCollect: 0,
  lines: [],
  pickedUpAt: "2026-11-02T10:00:00Z",
};

describe("rider stops", () => {
  it("writes the blue-plate address", () => {
    expect(addressLine(stop)).toBe("Unit 3, Building 12, Street 850, Al Sadd");
    expect(addressLine({ ...stop, unit: undefined })).toBe("Building 12, Street 850, Al Sadd");
  });

  it("builds call, WhatsApp and map links", () => {
    const links = stopLinks(stop);
    expect(links.call).toBe("tel:+97455551234");
    expect(links.whatsapp).toBe("https://wa.me/97455551234");
    expect(links.map).toContain("Building%2012%2C%20Street%20850%2C%20Al%20Sadd%2C%20Qatar");
  });

  it("delivers the oldest pick-up first", () => {
    const later = { ...stop, number: "JC-1002", pickedUpAt: "2026-11-02T10:05:00Z" };
    expect(sortStops([later, stop]).map((s) => s.number)).toEqual(["JC-1001", "JC-1002"]);
  });
});
