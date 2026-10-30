import { colors, spacing } from "@jollofco/brand";
import {
  addDays,
  checkPortions,
  dishesOfTheDay,
  regionOfDay,
  toQatarTime,
  type IsoDate,
} from "@jollofco/core";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import type { AdminSource, DayStock } from "../data/admin";
import { L } from "../labels";
import { SaveField, ui } from "../ui";

/** Portions of each dish of the day for today and the next 6 days. */
export function PortionsScreen({ source, now }: { source: AdminSource; now: Date }) {
  const today = toQatarTime(now).date;
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i));
  return (
    <View>
      {days.map((date) => (
        <Day key={date} date={date} source={source} />
      ))}
    </View>
  );
}

function Day({ date, source }: { date: IsoDate; source: AdminSource }) {
  const dishes = dishesOfTheDay(date);
  const [stock, setStock] = useState<DayStock[]>([]);
  const reload = () =>
    source
      .stockOn(
        date,
        dishes.map((d) => d.id),
      )
      .then(setStock);
  useEffect(() => {
    reload();
  }, [date, source]);

  const label = new Date(`${date}T12:00:00Z`).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });

  return (
    <View style={ui.card}>
      <Text style={ui.h2}>
        {label} · {L.regions[regionOfDay(date)]}
      </Text>
      {stock.map((s) => (
        <PortionRow
          key={s.dishId}
          date={date}
          stock={s}
          name={dishes.find((d) => d.id === s.dishId)!.name.en}
          source={source}
          onSaved={reload}
        />
      ))}
    </View>
  );
}

function PortionRow(props: {
  date: IsoDate;
  stock: DayStock;
  name: string;
  source: AdminSource;
  onSaved: () => void;
}) {
  const { date, stock, name, source, onSaved } = props;
  const [value, setValue] = useState(String(stock.portions));
  const [message, setMessage] = useState<{ text: string; error: boolean }>();

  async function save() {
    const checked = checkPortions(value, stock.sold);
    if (!checked.ok) return setMessage({ text: L.portionsErrors[checked.error], error: true });
    await source.setPortions(date, stock.dishId, checked.value);
    setMessage({ text: L.saved, error: false });
    onSaved();
  }

  return (
    <View style={styles.row}>
      <View style={styles.info}>
        <Text style={ui.name}>{name}</Text>
        <Text style={ui.muted}>{L.sold(stock.sold)}</Text>
      </View>
      <SaveField
        label={`Portions ${name} ${date}`}
        value={value}
        onChange={(v) => {
          setValue(v);
          setMessage(undefined);
        }}
        onSave={save}
        message={message?.text}
        error={message?.error}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing(4),
    paddingVertical: spacing(2),
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  info: { flex: 1 },
});
