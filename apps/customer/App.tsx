import {
  applyMenuUpdates,
  changeCartDay,
  orderableDays,
  toQatarTime,
  type Cart,
  type Lang,
} from "@jollofco/core";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { CheckoutScreen } from "./src/screens/CheckoutScreen";
import { ConfirmationScreen } from "./src/screens/ConfirmationScreen";
import { menuSource } from "./src/data/menu";
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

/**
 * Loads live prices and dishes on/off from the database, at start and every minute.
 * Each load re-renders the app, so screens re-read the menu.
 */
function useLiveMenu(now: Date, onUpdated: () => void): void {
  const [, setVersion] = useState(0);
  useEffect(() => {
    let active = true;
    menuSource
      .updates()
      .then((list) => {
        if (!active) return;
        applyMenuUpdates(list);
        onUpdated();
        setVersion((v) => v + 1);
      })
      .catch(() => {}); // offline: keep the menu we have
    return () => {
      active = false;
    };
  }, [now]);
}

const emptyCart = (now: Date): Cart => ({
  date: orderableDays(now)[0]?.date ?? toQatarTime(now).date,
  lines: [],
});

type Screen =
  | { name: "home" }
  | { name: "checkout" }
  | { name: "confirmation"; order: { number: string; total: number } };

/** Three screens, switched with plain state. Move to expo-router when the app grows. */
export default function App() {
  const [lang, setLang] = useState<Lang>("en");
  const now = useNow();
  const [cart, setCart] = useState<Cart>(() => emptyCart(now));
  const [screen, setScreen] = useState<Screen>({ name: "home" });
  // A dish switched off by the admin leaves the basket.
  useLiveMenu(now, () => setCart((c) => changeCartDay(c, c.date).cart));

  return (
    <>
      <StatusBar style={screen.name === "confirmation" ? "light" : "dark"} />
      {screen.name === "home" && (
        <HomeScreen
          lang={lang}
          now={now}
          onToggleLanguage={() => setLang(lang === "en" ? "ar" : "en")}
          cart={cart}
          setCart={setCart}
          onCheckout={() => setScreen({ name: "checkout" })}
        />
      )}
      {screen.name === "checkout" && (
        <CheckoutScreen
          cart={cart}
          lang={lang}
          now={now}
          onBack={() => setScreen({ name: "home" })}
          onPlaced={(order) => {
            setCart(emptyCart(now));
            setScreen({ name: "confirmation", order });
          }}
        />
      )}
      {screen.name === "confirmation" && (
        <ConfirmationScreen
          order={screen.order}
          lang={lang}
          onDone={() => setScreen({ name: "home" })}
        />
      )}
    </>
  );
}
