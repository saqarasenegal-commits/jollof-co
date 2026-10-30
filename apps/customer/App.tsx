import type { Lang } from "@jollofco/core";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { HomeScreen } from "./src/screens/HomeScreen";

/** Refresh "now" every minute so cut-offs (22:00 pre-orders, opening hours) update on screen. */
function useNow(intervalMs = 60_000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

export default function App() {
  const [lang, setLang] = useState<Lang>("en");
  const now = useNow();

  return (
    <>
      <StatusBar style="dark" />
      <HomeScreen
        lang={lang}
        now={now}
        onToggleLanguage={() => setLang(lang === "en" ? "ar" : "en")}
      />
    </>
  );
}
