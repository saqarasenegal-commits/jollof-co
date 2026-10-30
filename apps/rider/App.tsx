import { colors, spacing } from "@jollofco/brand";
import { addressLine, findDish, sortStops, stopLinks, type RiderStop } from "@jollofco/core";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SIGN_IN_EN, StaffGate, staffClientFromEnv } from "@jollofco/staff";
import { demoStops, supabaseStops, type StopSource } from "./src/data/stops";

// Live database when .env is set (riders sign in first), sample deliveries otherwise.
// AsyncStorage keeps the rider signed in between app launches.
const client = staffClientFromEnv(AsyncStorage);
const liveSource = client && supabaseStops(client);

/** Rider app: English only for now (riders' language to confirm with the owner). */
export default function App() {
  if (!client || !liveSource) return <DemoRider />;
  return (
    <StaffGate client={client} allowed={["rider"]} labels={SIGN_IN_EN} signOutLabel="Sign out">
      {() => <Deliveries source={liveSource} />}
    </StaffGate>
  );
}

function DemoRider() {
  const source = useMemo(() => demoStops(new Date()), []);
  return <Deliveries source={source} />;
}

function Deliveries({ source }: { source: StopSource }) {
  const [stops, setStops] = useState<RiderStop[]>([]);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => source.watch(setStops), [source]);

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.title}>My deliveries</Text>
        <Text style={styles.count}>{stops.length}</Text>
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
      <ScrollView contentContainerStyle={styles.list}>
        {stops.length === 0 && <Text style={styles.empty}>No delivery right now.</Text>}
        {sortStops(stops).map((s) => (
          <Stop
            key={s.orderId}
            stop={s}
            onDelivered={() =>
              source.markDelivered(s.orderId).then(
                () => setError(null),
                (e: Error) => setError(e.message),
              )
            }
          />
        ))}
      </ScrollView>
    </View>
  );
}

function Stop({ stop, onDelivered }: { stop: RiderStop; onDelivered: () => void }) {
  const links = stopLinks(stop);
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.number}>{stop.number}</Text>
        <Text style={[styles.pay, stop.cashToCollect > 0 && styles.cash]}>
          {stop.cashToCollect > 0 ? `Collect QAR ${stop.cashToCollect}` : "Paid"}
        </Text>
      </View>
      <Text style={styles.customer}>{stop.customerName}</Text>
      <Text style={styles.address}>{addressLine(stop)}</Text>
      {stop.note && <Text style={styles.note}>“{stop.note}”</Text>}
      <Text style={styles.items}>
        {stop.lines.map((l) => `${l.qty}× ${findDish(l.dishId)?.name.en ?? l.dishId}`).join(" · ")}
      </Text>
      <View style={styles.buttons}>
        <LinkButton label="Call" url={links.call} />
        <LinkButton label="WhatsApp" url={links.whatsapp} />
        <LinkButton label="Map" url={links.map} />
      </View>
      <Pressable accessibilityRole="button" onPress={onDelivered} style={styles.delivered}>
        <Text style={styles.deliveredText}>Delivered</Text>
      </Pressable>
    </View>
  );
}

function LinkButton({ label, url }: { label: string; url: string }) {
  return (
    <Pressable accessibilityRole="link" onPress={() => Linking.openURL(url)} style={styles.link}>
      <Text style={styles.linkText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  error: { color: colors.bissap, paddingHorizontal: spacing(4), paddingTop: spacing(2) },
  screen: { flex: 1, backgroundColor: colors.indigo },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing(4),
    paddingTop: spacing(14),
  },
  title: { color: colors.white, fontSize: 24, fontWeight: "800" },
  count: {
    color: colors.indigo,
    backgroundColor: colors.saffron,
    fontWeight: "800",
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(1),
    borderRadius: 999,
    overflow: "hidden",
  },
  list: { padding: spacing(4), gap: spacing(4) },
  empty: { color: colors.linen, textAlign: "center", marginTop: spacing(10) },
  card: { backgroundColor: colors.white, borderRadius: 16, padding: spacing(4) },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  number: { fontSize: 20, fontWeight: "800", color: colors.indigo },
  pay: { color: colors.muted, fontWeight: "700" },
  cash: { color: colors.bissap },
  customer: { marginTop: spacing(2), fontSize: 16, fontWeight: "700", color: colors.indigo },
  address: { marginTop: 2, color: colors.indigo },
  note: { marginTop: spacing(2), color: colors.bissap, fontStyle: "italic" },
  items: { marginTop: spacing(2), color: colors.muted },
  buttons: { flexDirection: "row", gap: spacing(2), marginTop: spacing(4) },
  link: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.indigo,
    borderRadius: 999,
    paddingVertical: spacing(2),
    alignItems: "center",
  },
  linkText: { color: colors.indigo, fontWeight: "700" },
  delivered: {
    marginTop: spacing(3),
    backgroundColor: colors.saffron,
    borderRadius: 999,
    paddingVertical: spacing(4),
    alignItems: "center",
  },
  deliveredText: { color: colors.indigo, fontWeight: "800", fontSize: 16 },
});
