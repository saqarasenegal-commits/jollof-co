import { colors, spacing } from "@jollofco/brand";
import { parsePrice, type Dish, type Section } from "@jollofco/core";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Switch, Text, View } from "react-native";
import type { AdminSource } from "../data/admin";
import { L } from "../labels";
import { SaveField, ui } from "../ui";

type AdminDish = Dish & { active: boolean };
const SECTIONS: Section[] = ["mains", "sides", "drinks", "desserts", "combos"];

/** Prices and dishes on/off, grouped by menu section. */
export function MenuScreen({ source }: { source: AdminSource }) {
  const [dishes, setDishes] = useState<AdminDish[]>([]);
  const reload = () => source.dishes().then(setDishes, () => {}); // offline: keep the last list
  useEffect(() => {
    reload();
  }, [source]);

  return (
    <View>
      {SECTIONS.map((section) => (
        <View key={section} style={ui.card}>
          <Text style={ui.h2}>{L.sections[section]}</Text>
          {dishes
            .filter((d) => d.section === section)
            .map((d) => (
              <DishRow key={d.id} dish={d} source={source} onSaved={reload} />
            ))}
        </View>
      ))}
    </View>
  );
}

function DishRow({
  dish,
  source,
  onSaved,
}: {
  dish: AdminDish;
  source: AdminSource;
  onSaved: () => void;
}) {
  const [price, setPrice] = useState(String(dish.price));
  const [message, setMessage] = useState<{ text: string; error: boolean }>();

  async function savePrice() {
    const parsed = parsePrice(price);
    if (!parsed.ok) return setMessage({ text: L.priceErrors[parsed.error], error: true });
    try {
      await source.updateDish(dish.id, { price: parsed.value });
      setMessage({ text: L.saved, error: false });
      onSaved();
    } catch {
      setMessage({ text: L.saveFailed, error: true });
    }
  }

  async function toggle(active: boolean) {
    try {
      await source.updateDish(dish.id, { active });
      onSaved();
    } catch {
      setMessage({ text: L.saveFailed, error: true });
    }
  }

  return (
    <View style={[styles.row, !dish.active && styles.off]}>
      <View style={styles.info}>
        <Text style={ui.name}>{dish.name.en}</Text>
        <Text style={ui.muted}>
          {dish.name.ar}
          {dish.dailySpecial ? ` · ${L.dishOfTheDay}` : ""}
        </Text>
      </View>
      <SaveField
        label={`${L.price} ${dish.name.en}`}
        value={price}
        onChange={(v) => {
          setPrice(v);
          setMessage(undefined);
        }}
        onSave={savePrice}
        message={message?.text}
        error={message?.error}
      />
      <Pressable style={styles.toggle} onPress={() => toggle(!dish.active)}>
        <Switch
          value={dish.active}
          onValueChange={toggle}
          accessibilityLabel={`${dish.name.en}: ${dish.active ? L.onMenu : L.offMenu}`}
          trackColor={{ true: colors.saffron, false: colors.line }}
        />
        <Text style={ui.muted}>{dish.active ? L.onMenu : L.offMenu}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing(4),
    paddingVertical: spacing(3),
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    flexWrap: "wrap",
  },
  off: { opacity: 0.55 },
  info: { flex: 1, minWidth: 200 },
  toggle: { alignItems: "center", gap: 2, width: 70 },
});
