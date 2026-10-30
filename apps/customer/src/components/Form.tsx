import type { Lang } from "@jollofco/core";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from "react-native";
import { colors, spacing } from "../theme";
import { textDir } from "./textDir";

/** Label + input + error message. */
export function Field({
  label,
  error,
  lang,
  prefix,
  ...input
}: TextInputProps & { label: string; error?: string; lang: Lang; prefix?: string }) {
  return (
    <View style={styles.field}>
      <Text style={[styles.label, textDir(lang)]}>{label}</Text>
      <View style={styles.inputRow}>
        {prefix && <Text style={styles.prefix}>{prefix}</Text>}
        <TextInput
          {...input}
          accessibilityLabel={label}
          placeholderTextColor={colors.muted}
          style={[styles.input, prefix ? styles.inputWithPrefix : null, !prefix && textDir(lang)]}
        />
      </View>
      {error && <Text style={[styles.error, textDir(lang)]}>{error}</Text>}
    </View>
  );
}

/** A row of choices, one selected. */
export function Chips<T extends string>({
  options,
  value,
  onChange,
  lang,
}: {
  options: Array<{ value: T; label: string }>;
  value: T | undefined;
  onChange: (value: T) => void;
  lang: Lang;
}) {
  return (
    <View style={[styles.chips, lang === "ar" && styles.chipsRtl]}>
      {options.map((o) => (
        <Pressable
          key={o.value}
          accessibilityRole="radio"
          accessibilityState={{ selected: o.value === value }}
          onPress={() => onChange(o.value)}
          style={[styles.chip, o.value === value && styles.chipOn]}
        >
          <Text style={[styles.chipText, o.value === value && styles.chipTextOn]}>{o.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export function Section({
  title,
  lang,
  children,
}: {
  title: string;
  lang: Lang;
  children: ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, textDir(lang)]}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: spacing(5) },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    color: colors.muted,
    marginBottom: spacing(2),
  },
  field: { marginBottom: spacing(3) },
  label: { color: colors.indigo, marginBottom: spacing(1), fontWeight: "600" },
  inputRow: { flexDirection: "row" },
  prefix: {
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(3),
    backgroundColor: colors.line,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
    color: colors.indigo,
  },
  input: {
    flex: 1,
    minWidth: 0,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(3),
    color: colors.indigo,
    fontSize: 16,
  },
  inputWithPrefix: { borderTopLeftRadius: 0, borderBottomLeftRadius: 0 },
  error: { color: colors.bissap, marginTop: spacing(1), fontSize: 13 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing(2) },
  chipsRtl: { flexDirection: "row-reverse" },
  chip: {
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(2),
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
  },
  chipOn: { backgroundColor: colors.indigo, borderColor: colors.indigo },
  chipText: { color: colors.indigo },
  chipTextOn: { color: colors.white, fontWeight: "700" },
});
