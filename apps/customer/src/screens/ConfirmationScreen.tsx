import type { Lang } from "@jollofco/core";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { strings } from "../i18n";
import { colors, spacing } from "../theme";

interface Props {
  order: { number: string; total: number };
  lang: Lang;
  onDone: () => void;
}

export function ConfirmationScreen({ order, lang, onDone }: Props) {
  const t = strings[lang];
  return (
    <View style={styles.screen}>
      <Text style={styles.amp}>&amp;</Text>
      <Text style={styles.title}>{t.thanks}</Text>
      <Text style={styles.number}>{t.orderNumber(order.number)}</Text>
      <Text style={styles.text}>{t.confirmation}</Text>
      <Text style={styles.total}>{t.qar(order.total)}</Text>
      <Pressable accessibilityRole="button" onPress={onDone} style={styles.button}>
        <Text style={styles.buttonText}>{t.backToMenu}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.indigo,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing(6),
  },
  amp: { fontSize: 96, color: colors.saffron, fontStyle: "italic", fontWeight: "700" },
  title: { fontSize: 32, fontWeight: "700", color: colors.white },
  number: { fontSize: 18, color: colors.saffron, marginTop: spacing(2), fontWeight: "700" },
  text: { color: colors.linen, textAlign: "center", marginTop: spacing(3), lineHeight: 22 },
  total: { color: colors.white, marginTop: spacing(2), fontSize: 16 },
  button: {
    marginTop: spacing(8),
    backgroundColor: colors.saffron,
    borderRadius: 999,
    paddingVertical: spacing(3),
    paddingHorizontal: spacing(8),
  },
  buttonText: { color: colors.indigo, fontWeight: "700" },
});
