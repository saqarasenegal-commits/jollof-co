import { qatarInstant } from "@jollofco/core";
import { describe, expect, it } from "vitest";
import { ConsoleMessages, handleOrderRequest, SandboxPayments } from "../src";
import { MemoryStore } from "./memoryStore";

const now = qatarInstant("2026-11-02", 12);
const order = {
  cart: { date: "2026-11-02", lines: [{ dishId: "jollof", qty: 1 }] },
  name: "Aïssatou",
  phone: "5555 1234",
  address: { zoneId: "west-bay", street: "850", building: "12" },
  slot: "asap",
  payment: "cash",
};

function services() {
  return {
    store: new MemoryStore(),
    payments: new SandboxPayments(),
    messages: new ConsoleMessages(),
  };
}

function post(body: unknown) {
  return new Request("https://example.test/place-order", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

describe("place-order endpoint", () => {
  it("answers the browser's CORS preflight", async () => {
    const res = await handleOrderRequest(
      new Request("https://x", { method: "OPTIONS" }),
      services(),
    );
    expect(res.status).toBe(204);
    expect(res.headers.get("access-control-allow-origin")).toBe("*");
  });

  it("returns the order number and total, nothing internal", async () => {
    const res = await handleOrderRequest(post(order), services(), now);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, number: "JC-1001", total: 55 });
  });

  it("returns validation errors with 422", async () => {
    const res = await handleOrderRequest(post({ ...order, phone: "12" }), services(), now);
    expect(res.status).toBe(422);
    expect(await res.json()).toEqual({ ok: false, errors: ["phone-invalid"] });
  });

  it("does not crash on a broken request", async () => {
    expect((await handleOrderRequest(post("{oops"), services(), now)).status).toBe(400);
    expect((await handleOrderRequest(post({}), services(), now)).status).toBe(500);
  });
});
