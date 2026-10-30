import { colors, spacing } from "@jollofco/brand";
import {
  canTransition,
  findDish,
  findZone,
  nextStatus,
  type KitchenOrder,
  type OrderStatus,
} from "@jollofco/core";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { Rider } from "../data/orders";
import { actionLabel, statusLabel } from "../labels";

const STATUS_COLOR: Record<OrderStatus, string> = {
  received: colors.bissap,
  cooking: colors.saffron,
  on_the_way: colors.indigo,
  delivered: colors.muted,
  cancelled: colors.muted,
};

interface Props {
  order: KitchenOrder;
  now: Date;
  riders: Rider[];
  onStatus: (status: OrderStatus) => void;
  onRider: (riderId: string) => void;
}

/** One order card on the kitchen screen. */
export function Ticket({ order, now, riders, onStatus, onRider }: Props) {
  const next = nextStatus(order.status);
  const waited = Math.round((now.getTime() - new Date(order.createdAt).getTime()) / 60_000);
  const finished = order.status === "delivered" || order.status === "cancelled";

  return (
    <View style={[styles.card, finished && styles.finished]}>
      <View style={styles.header}>
        <Text style={styles.number}>{order.number}</Text>
        <Text style={[styles.status, { backgroundColor: STATUS_COLOR[order.status] }]}>
          {statusLabel[order.status]}
        </Text>
      </View>
      <Text style={styles.when}>
        {order.slot === "asap" ? `ASAP · ${waited} min ago` : `Slot ${order.slot}`}
      </Text>
      <Text style={styles.customer}>
        {order.customerName} · {findZone(order.zoneId)?.name.en ?? order.zoneId}
      </Text>
      <View style={styles.lines}>
        {order.lines.map((l) => (
          <Text key={l.dishId} style={styles.line}>
            <Text style={styles.qty}>{l.qty}× </Text>
            {findDish(l.dishId)?.name.en ?? l.dishId}
          </Text>
        ))}
      </View>
      {order.note && <Text style={styles.note}>“{order.note}”</Text>}
      {next === "on_the_way" ? (
        <View style={styles.riders}>
          <Text style={styles.ridersLabel}>{actionLabel.on_the_way}:</Text>
          {riders.map((r) => (
            <Pressable
              key={r.id}
              accessibilityRole="button"
              onPress={() => onRider(r.id)}
              style={styles.rider}
            >
              <Text style={styles.actionText}>{r.name}</Text>
            </Pressable>
          ))}
        </View>
      ) : (
        next && (
          <Pressable
            accessibilityRole="button"
            onPress={() => onStatus(next)}
            style={styles.action}
          >
            <Text style={styles.actionText}>{actionLabel[next]}</Text>
          </Pressable>
        )
      )}
      {canTransition(order.status, "cancelled") && (
        <Pressable accessibilityRole="button" onPress={() => onStatus("cancelled")}>
          <Text style={styles.cancel}>Cancel order</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 280,
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing(4),
    borderWidth: 1,
    borderColor: colors.line,
  },
  finished: { opacity: 0.5 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  number: { fontSize: 20, fontWeight: "800", color: colors.indigo },
  status: {
    color: colors.white,
    fontWeight: "700",
    fontSize: 12,
    paddingHorizontal: spacing(2),
    paddingVertical: 2,
    borderRadius: 999,
    overflow: "hidden",
  },
  when: { marginTop: spacing(1), color: colors.indigo, fontWeight: "600" },
  customer: { color: colors.muted, marginTop: 2 },
  lines: { marginTop: spacing(3), gap: spacing(1) },
  line: { fontSize: 16, color: colors.indigo },
  qty: { fontWeight: "800" },
  note: { marginTop: spacing(2), color: colors.bissap, fontStyle: "italic" },
  action: {
    marginTop: spacing(4),
    backgroundColor: colors.saffron,
    borderRadius: 999,
    paddingVertical: spacing(3),
    alignItems: "center",
  },
  actionText: { color: colors.indigo, fontWeight: "800", fontSize: 16 },
  riders: { marginTop: spacing(4), gap: spacing(2) },
  ridersLabel: { color: colors.muted, fontWeight: "600" },
  rider: {
    backgroundColor: colors.saffron,
    borderRadius: 999,
    paddingVertical: spacing(2),
    alignItems: "center",
  },
  cancel: { color: colors.muted, textAlign: "center", marginTop: spacing(3), fontSize: 13 },
});
