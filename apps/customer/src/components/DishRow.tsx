import { ORIGINS, portionsLeft, type Dish, type Lang } from "@jollofco/core";
import { StyleSheet, Text, View } from "react-native";
import { strings } from "../i18n";
import { colors, spacing } from "../theme";
import { textDir } from "./textDir";

interface Props {
  dish: Dish;
  lang: Lang;
  /** Portions already sold that day (dishes of the day only). */
  sold: number;
}

export function DishRow({ dish, lang, sold }: Props) {
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
  badgeSoldOut: { color: colors.white, backgroundColor: colors.bissap },
});
