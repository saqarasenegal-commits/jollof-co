import { colors, spacing } from "@jollofco/brand";
import {
  dishesOfTheDay,
  prepList,
  regionOfDay,
  sortTickets,
  toQatarTime,
  type KitchenOrder,
} from "@jollofco/core";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { PrepList } from "./src/components/PrepList";
import { Ticket } from "./src/components/Ticket";
import { SIGN_IN_EN, StaffGate, staffClientFromEnv } from "@jollofco/staff";
import { demoKitchen, supabaseKitchen, type KitchenSource, type Rider } from "./src/data/orders";

const REGION_NAME = { west: "West Africa", east: "East Africa", north: "North Africa" } as const;

function useNow(intervalMs = 30_000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

// Live database when .env is set (staff sign in first), sample orders otherwise.
const client = staffClientFromEnv();
const liveSource = client && supabaseKitchen(client);

export default function App() {
  if (!client || !liveSource) return <DemoKitchen />;
  return (
    <StaffGate client={client} allowed={["kitchen"]} labels={SIGN_IN_EN} signOutLabel="Sign out">
      {() => <KitchenScreen source={liveSource} />}
    </StaffGate>
  );
}

function DemoKitchen() {
  const { date } = toQatarTime(new Date());
  const source = useMemo(() => demoKitchen(date, new Date()), [date]);
  return <KitchenScreen source={source} />;
}

function KitchenScreen({ source }: { source: KitchenSource }) {
  const now = useNow();
  const { date, hour, minute } = toQatarTime(now);
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [riders, setRiders] = useState<Rider[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => source.watch(date, setOrders), [source, date]);
  useEffect(() => {
    source.riders().then(setRiders, (e: Error) => setError(e.message));
  }, [source]);

  const report = (p: Promise<void>) =>
    p.then(
      () => setError(null),
      (e: Error) => setError(e.message),
    );

  const tickets = sortTickets(orders);
  const prep = prepList(orders, date);
  const clock = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Image
          source={require("./assets/jollofco-wordmark.png")}
          style={styles.logo}
          resizeMode="contain"
          accessibilityLabel="jollof&co"
        />
        <Text style={styles.headerText}>
          Kitchen · {REGION_NAME[regionOfDay(date)]} day ·{" "}
          {dishesOfTheDay(date)
            .map((d) => d.name.en)
            .join(", ")}
        </Text>
        <Text style={styles.clock}>{clock}</Text>
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
      <View style={styles.body}>
        <PrepList lines={prep} />
        <ScrollView contentContainerStyle={styles.tickets}>
          {tickets.map((o) => (
            <Ticket
              key={o.id}
              order={o}
              now={now}
              riders={riders}
              onStatus={(status) => report(source.setStatus(o.id, status))}
              onRider={(riderId) => report(source.assignRider(o.id, riderId))}
            />
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.linen, padding: spacing(4) },
  header: { flexDirection: "row", alignItems: "center", gap: spacing(4), marginBottom: spacing(4) },
  logo: { width: 120, height: 34 },
  headerText: { flex: 1, color: colors.indigo, fontWeight: "600" },
  clock: { fontSize: 28, fontWeight: "800", color: colors.indigo },
  error: { color: colors.bissap, marginBottom: spacing(2) },
  body: { flex: 1, flexDirection: "row", gap: spacing(4), alignItems: "flex-start" },
  tickets: { flexDirection: "row", flexWrap: "wrap", gap: spacing(4) },
});
