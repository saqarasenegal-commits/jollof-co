import {
  addToCart,
  changeCartDay,
  findDish,
  menuFor,
  qtyInCart,
  regionOfDay,
  toQatarTime,
  type IsoDate,
  type Lang,
  type Region,
  type Cart,
} from "@jollofco/core";
import { useEffect, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { CartBar } from "../components/CartBar";
import { DishRow } from "../components/DishRow";
import { RegionCard } from "../components/RegionCard";
import { textDir } from "../components/textDir";
import { placeholderStock, type StockSource } from "../data/stock";
import { strings, weekdayName } from "../i18n";
import { colors, spacing } from "../theme";

const REGIONS: Region[] = ["west", "east", "north"];
const wordmark = {
  en: require("../../assets/jollofco-wordmark.png"),
  ar: require("../../assets/jollofco-wordmark-ar.png"),
};

interface Props {
  lang: Lang;
  onToggleLanguage: () => void;
  now: Date;
  cart: Cart;
  setCart: (cart: Cart) => void;
  onCheckout: () => void;
  stock?: StockSource;
}

export function HomeScreen({
  lang,
  onToggleLanguage,
  now,
  cart,
  setCart,
  onCheckout,
  stock = placeholderStock,
}: Props) {
  const t = strings[lang];
  const today = toQatarTime(now).date;
  const [sold, setSold] = useState<Record<string, number>>({});
  const [notice, setNotice] = useState<string | null>(null);
  const day = cart.date;

  function selectDay(date: IsoDate) {
    const moved = changeCartDay(cart, date);
    setCart(moved.cart);
    setNotice(
      moved.removed.length
        ? t.removedFromBasket(moved.removed.map((id) => findDish(id)!.name[lang]).join(", "))
        : null,
    );
  }

  function changeQty(dishId: string, delta: number) {
    const result = addToCart(cart, dishId, delta, sold);
    if (result.ok) setCart(result.cart);
  }

  useEffect(() => {
    let active = true;
    stock.soldOn(day).then((s) => active && setSold(s));
    return () => {
      active = false;
    };
  }, [day, stock]);

  const menu = menuFor(day);
  const specials = menu.filter((d) => d.dailySpecial);
  const fixed = menu.filter((d) => !d.dailySpecial);

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.header, lang === "ar" && styles.headerRtl]}>
          <Image
            source={wordmark[lang]}
            style={styles.logo}
            resizeMode="contain"
            accessibilityLabel="jollof&co"
          />
          <Pressable accessibilityRole="button" onPress={onToggleLanguage} style={styles.lang}>
            <Text style={styles.langText}>{t.switchLanguage}</Text>
          </Pressable>
        </View>
        <Text style={[styles.tagline, textDir(lang)]}>{t.tagline}</Text>

        <Text style={[styles.section, textDir(lang)]}>
          {t.todayRegion(t.regions[regionOfDay(today)])}
        </Text>
        {REGIONS.map((region) => (
          <RegionCard
            key={region}
            region={region}
            now={now}
            today={today}
            lang={lang}
            onOrder={selectDay}
          />
        ))}

        {notice && <Text style={[styles.notice, textDir(lang)]}>{notice}</Text>}
        <Text style={[styles.section, textDir(lang)]}>
          {t.dishesOfTheDay} · {weekdayName(day, lang)}
        </Text>
        {specials.map((d) => (
          <DishRow
            key={d.id}
            dish={d}
            lang={lang}
            sold={sold[d.id] ?? 0}
            qty={qtyInCart(cart, d.id)}
            onChange={(delta) => changeQty(d.id, delta)}
          />
        ))}

        <Text style={[styles.section, textDir(lang)]}>{t.fixedMenu}</Text>
        {fixed.map((d) => (
          <DishRow
            key={d.id}
            dish={d}
            lang={lang}
            sold={0}
            qty={qtyInCart(cart, d.id)}
            onChange={(delta) => changeQty(d.id, delta)}
          />
        ))}
      </ScrollView>
      <CartBar cart={cart} lang={lang} onPress={onCheckout} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.linen },
  content: { padding: spacing(4), paddingTop: spacing(14), paddingBottom: spacing(40) },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headerRtl: { flexDirection: "row-reverse" },
  logo: { width: 150, height: 43 },
  lang: {
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(2),
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.indigo,
  },
  langText: { color: colors.indigo, fontWeight: "600" },
  tagline: { color: colors.muted, marginTop: spacing(2), marginBottom: spacing(4) },
  notice: {
    marginTop: spacing(2),
    padding: spacing(3),
    borderRadius: 12,
    backgroundColor: colors.white,
    color: colors.bissap,
  },
  section: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    color: colors.muted,
    marginTop: spacing(4),
    marginBottom: spacing(2),
  },
});
