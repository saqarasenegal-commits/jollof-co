import { ORIGINS, portionsLeft, type Dish, type Lang } from "@jollofco/core";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { strings } from "../i18n";
import { colors, spacing } from "../theme";
import { textDir } from "./textDir";

interface Props {
  dish: Dish;
  lang: Lang;
  /** Portions already sold that day (dishes of the day only). */
  sold: number;
  /** Quantity of this dish in the basket. */
  qty: number;
  onChange: (delta: number) => void;
}

export function DishRow({ dish, lang, sold, qty, onChange }: Props) {
  const t = strings[lang];
  const left = portionsLeft(dish, sold);
  const rtl = lang === "ar";

  return (
    <View style={[styles.row, rtl && styles.rowRtl, left === 0 && styles.soldOut]}>
      <View style={styles.text}>
        <Text style={[styles.name, textDir(lang)]}>{dish.name[lang]}</Text>
        <Text style={[styles.origin, textDir(lang)]}>
          {ORIGINS[dish.origin]?.[lang]}
          {dish.spicy ? ` · ${t.spicy}` : ""}
        </Text>
        <Text style={[styles.description, textDir(lang)]}>{dish.description[lang]}</Text>
      </View>
      <View style={[styles.side, rtl ? styles.sideRtl : styles.sideLtr]}>
        <Text style={styles.price}>{t.qar(dish.price)}</Text>
        {left !== null && (
          <Text style={[styles.badge, left === 0 && styles.badgeSoldOut]}>
            {left === 0 ? t.soldOut : t.portionsLeft(left)}
          </Text>
        )}
        <View style={[styles.stepper, rtl && styles.rowRtl]}>
          {qty > 0 && (
            <>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t.remove}
                onPress={() => onChange(-1)}
                style={styles.stepButton}
              >
                <Text style={styles.stepText}>−</Text>
              </Pressable>
              <Text style={styles.qty}>{qty}</Text>
            </>
          )}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t.add}
            disabled={left !== null && qty >= left}
            onPress={() => onChange(1)}
            style={[
              styles.stepButton,
              styles.addButton,
              left !== null && qty >= left && styles.disabled,
            ]}
          >
            <Text style={styles.stepText}>+</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    paddingVertical: spacing(3),
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  rowRtl: { flexDirection: "row-reverse" },
  soldOut: { opacity: 0.5 },
  text: { flex: 1 },
  name: { fontSize: 16, fontWeight: "700", color: colors.indigo },
  origin: { fontSize: 12, color: colors.muted, marginTop: 2 },
  description: { fontSize: 13, color: colors.indigo, marginTop: spacing(1), lineHeight: 18 },
  side: { alignItems: "flex-end", gap: spacing(1) },
  sideLtr: { marginLeft: spacing(3) },
  sideRtl: { marginRight: spacing(3), alignItems: "flex-start" },
  price: { fontWeight: "700", color: colors.indigo },
  badge: {
    fontSize: 12,
    color: colors.indigo,
    backgroundColor: colors.line,
    paddingHorizontal: spacing(2),
    paddingVertical: 2,
    borderRadius: 999,
    overflow: "hidden",
  },
  stepper: { flexDirection: "row", alignItems: "center", gap: spacing(2), marginTop: spacing(1) },
  stepButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.line,
  },
  addButton: { backgroundColor: colors.saffron },
  disabled: { opacity: 0.4 },
  stepText: { fontSize: 18, fontWeight: "700", color: colors.indigo },
  qty: { minWidth: 16, textAlign: "center", fontWeight: "700", color: colors.indigo },
  badgeSoldOut: { color: colors.white, backgroundColor: colors.bissap },
});
