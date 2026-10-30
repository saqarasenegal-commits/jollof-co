import { cartCount, cartSubtotal, MIN_ORDER_QAR, type Cart, type Lang } from "@jollofco/core";
import { StyleSheet, Text, View } from "react-native";
import { strings, weekdayName } from "../i18n";
import { colors, spacing } from "../theme";

/** Sticky summary at the bottom of the screen. Checkout comes in phase 3. */
export function CartBar({ cart, lang }: { cart: Cart; lang: Lang }) {
  const t = strings[lang];
  const count = cartCount(cart);
  if (count === 0) return null;
  const subtotal = cartSubtotal(cart.lines);
  const missing = Math.max(0, MIN_ORDER_QAR - subtotal);
  const rtl = lang === "ar";

  return (
    <View style={styles.bar}>
      <View style={[styles.row, rtl && styles.rowRtl]}>
        <Text style={styles.text}>
          {t.basket(count)} · {t.forDay(weekdayName(cart.date, lang))}
        </Text>
        <Text style={styles.total}>{t.qar(subtotal)}</Text>
      </View>
      {missing > 0 && (
        <Text style={[styles.hint, { textAlign: rtl ? "right" : "left" }]}>
          {t.missingForMinimum(missing)}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: "absolute",
    left: spacing(4),
    right: spacing(4),
    bottom: spacing(6),
    backgroundColor: colors.indigo,
    borderRadius: 16,
    padding: spacing(4),
  },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  rowRtl: { flexDirection: "row-reverse" },
  text: { color: colors.white, fontWeight: "600" },
  total: { color: colors.saffron, fontWeight: "700", fontSize: 16 },
  hint: { color: colors.line, fontSize: 12, marginTop: spacing(1) },
});
