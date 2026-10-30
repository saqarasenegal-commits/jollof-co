import { colors, spacing } from "@jollofco/brand";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { L } from "./labels";

/** A small number field with a Save button and a message under it. */
export function SaveField({
  value,
  onChange,
  onSave,
  message,
  error,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  onSave: () => void;
  message?: string;
  error?: boolean;
  label: string;
}) {
  return (
    <View>
      <View style={ui.row}>
        <TextInput
          accessibilityLabel={label}
          value={value}
          onChangeText={onChange}
          keyboardType="decimal-pad"
          style={ui.input}
        />
        <Pressable accessibilityRole="button" onPress={onSave} style={ui.button}>
          <Text style={ui.buttonText}>{L.save}</Text>
        </Pressable>
      </View>
      {message && <Text style={[ui.message, error && ui.error]}>{message}</Text>}
    </View>
  );
}

export const ui = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: spacing(2) },
  input: {
    width: 90,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(2),
    color: colors.indigo,
    fontSize: 16,
  },
  button: {
    backgroundColor: colors.saffron,
    borderRadius: 999,
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(2),
  },
  buttonText: { color: colors.indigo, fontWeight: "700" },
  message: { color: colors.muted, fontSize: 12, marginTop: spacing(1), maxWidth: 260 },
  error: { color: colors.bissap },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing(4),
    marginBottom: spacing(3),
  },
  h2: { fontSize: 18, fontWeight: "800", color: colors.indigo, marginBottom: spacing(2) },
  name: { color: colors.indigo, fontWeight: "700", fontSize: 15 },
  muted: { color: colors.muted, fontSize: 12, textAlign: "left" },
});
