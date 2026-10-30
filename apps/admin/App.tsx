import { colors, spacing } from "@jollofco/brand";
import { StatusBar } from "expo-status-bar";
import { useMemo, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { demoAdmin, type AdminSource } from "./src/data/admin";
import { L } from "./src/labels";
import { MenuScreen } from "./src/screens/MenuScreen";
import { PortionsScreen } from "./src/screens/PortionsScreen";

type Tab = keyof typeof L.tabs;

export default function App() {
  const source: AdminSource = useMemo(() => demoAdmin(), []);
  const [tab, setTab] = useState<Tab>("menu");

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
        <Text style={styles.title}>{L.title}</Text>
      </View>
      <View style={styles.tabs}>
        {(Object.keys(L.tabs) as Tab[]).map((t) => (
          <Pressable
            key={t}
            accessibilityRole="tab"
            accessibilityState={{ selected: t === tab }}
            onPress={() => setTab(t)}
            style={[styles.tab, t === tab && styles.tabOn]}
          >
            <Text style={[styles.tabText, t === tab && styles.tabTextOn]}>{L.tabs[t]}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.notice}>{L.placeholderNotice}</Text>
      <ScrollView contentContainerStyle={styles.content}>
        {tab === "menu" ? (
          <MenuScreen source={source} />
        ) : (
          <PortionsScreen source={source} now={new Date()} />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.linen },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(3),
    padding: spacing(4),
    paddingTop: spacing(10),
  },
  logo: { width: 120, height: 34 },
  title: { fontSize: 20, fontWeight: "800", color: colors.indigo },
  tabs: { flexDirection: "row", gap: spacing(2), paddingHorizontal: spacing(4) },
  tab: {
    paddingHorizontal: spacing(4),
    paddingVertical: spacing(2),
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.indigo,
  },
  tabOn: { backgroundColor: colors.indigo },
  tabText: { color: colors.indigo, fontWeight: "700" },
  tabTextOn: { color: colors.white },
  notice: {
    color: colors.muted,
    fontSize: 12,
    paddingHorizontal: spacing(4),
    marginTop: spacing(3),
  },
  content: { padding: spacing(4), maxWidth: 900, width: "100%", alignSelf: "center" },
});
