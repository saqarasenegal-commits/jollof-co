import {
  dishesOfTheDay,
  nextDaysForRegion,
  regionAction,
  type Lang,
  type Region,
} from "@jollofco/core";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { strings, weekdayName } from "../i18n";
import { colors, spacing } from "../theme";
import { textDir } from "./textDir";

interface Props {
  region: Region;
  now: Date;
  today: string;
  lang: Lang;
  onOrder: (date: string) => void;
}

/** Home page card: one per region, with its days, its dishes and what can be ordered now. */
export function RegionCard({ region, now, today, lang, onOrder }: Props) {
  const t = strings[lang];
  const action = regionAction(region, now);
  const days = [...new Set(nextDaysForRegion(region, today, 7).map((d) => weekdayName(d, lang)))];
  const dishes = dishesOfTheDay(action.date);
  const label =
    action.kind === "today"
      ? t.orderToday
      : action.kind === "preorder"
        ? t.preorderTomorrow
        : t.preorderOpens(weekdayName(action.opensOn, lang));

  return (
    <View style={styles.card}>
      <Text style={[styles.title, textDir(lang)]}>{t.regions[region]}</Text>
      <Text style={[styles.days, textDir(lang)]}>
        {t.servedOn} {days.join(" · ")}
      </Text>
      <Text style={[styles.dishes, textDir(lang)]}>
        {dishes.map((d) => d.name[lang]).join(" · ")}
      </Text>
      <Pressable
        accessibilityRole="button"
        disabled={action.kind === "opensOn"}
        onPress={() => onOrder(action.date)}
        style={[styles.button, action.kind === "opensOn" && styles.buttonDisabled]}
      >
        <Text style={[styles.buttonText, action.kind === "opensOn" && styles.buttonTextDisabled]}>
          {label}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing(4),
    marginBottom: spacing(3),
    borderWidth: 1,
    borderColor: colors.line,
  },
  title: { fontSize: 20, fontWeight: "700", color: colors.indigo },
  days: { marginTop: spacing(1), color: colors.muted },
  dishes: { marginTop: spacing(2), color: colors.indigo, lineHeight: 20 },
  button: {
    marginTop: spacing(3),
    backgroundColor: colors.saffron,
    borderRadius: 999,
    paddingVertical: spacing(3),
    alignItems: "center",
  },
  buttonDisabled: { backgroundColor: colors.line },
  buttonText: { color: colors.indigo, fontWeight: "700" },
  buttonTextDisabled: { color: colors.muted },
});
