/** Kitchen screen texts. English only for now; add Arabic here like apps/customer/src/i18n.ts if needed. */
import type { OrderStatus } from "@jollofco/core";

export const statusLabel: Record<OrderStatus, string> = {
  received: "New",
  cooking: "Cooking",
  on_the_way: "With rider",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

/** Text of the main button that moves an order to this status. */
export const actionLabel: Partial<Record<OrderStatus, string>> = {
  cooking: "Start cooking",
  on_the_way: "Hand to rider",
  delivered: "Mark delivered",
};
