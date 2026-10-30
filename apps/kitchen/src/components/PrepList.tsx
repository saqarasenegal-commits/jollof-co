import { colors, spacing } from "@jollofco/brand";
import { findDish, PORTIONS_PER_DAY, type PrepLine } from "@jollofco/core";
import { StyleSheet, Text, View } from "react-native";

/** Left column: how many portions of each dish are ordered, and what is left of the 40. */
export function PrepList({ lines }: { lines: PrepLine[] }) {
  return (
    <View style={styles.panel}>
      <Text style={styles.title}>To cook today</Text>
      <View style={styles.headerRow}>
        <Text style={[styles.head, styles.dish]}>Dish</Text>
        <Text style={styles.head}>New</Text>
        <Text style={styles.head}>Total</Text>
      </View>
      {lines.map((l) => {
        const dish = findDish(l.dishId);
        return (
          <View key={l.dishId} style={styles.row}>
            <View style={styles.dish}>
              <Text style={styles.name}>{dish?.name.en ?? l.dishId}</Text>
              {dish?.dailySpecial && (
                <Text style={styles.left}>
                  {PORTIONS_PER_DAY - l.total} of {PORTIONS_PER_DAY} left
                </Text>
              )}
            </View>
            <Text style={[styles.num, l.toCook > 0 && styles.hot]}>{l.toCook}</Text>
            <Text style={styles.num}>{l.total}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { width: 300, backgroundColor: colors.white, borderRadius: 16, padding: spacing(4) },
  title: { fontSize: 18, fontWeight: "800", color: colors.indigo, marginBottom: spacing(3) },
  headerRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    paddingBottom: spacing(1),
  },
  head: { width: 50, textAlign: "right", color: colors.muted, fontSize: 12, fontWeight: "700" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing(2),
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  dish: { flex: 1, textAlign: "left" },
  name: { color: colors.indigo, fontWeight: "600" },
  left: { color: colors.muted, fontSize: 12 },
  num: { width: 50, textAlign: "right", fontSize: 18, color: colors.indigo },
  hot: { color: colors.bissap, fontWeight: "800" },
});
