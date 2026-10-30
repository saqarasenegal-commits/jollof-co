import {
  canOrderFor,
  cartTotals,
  DELIVERY_SLOTS,
  findZone,
  ZONES,
  type Cart,
  type Lang,
  type OrderRequest,
  type PaymentMethod,
} from "@jollofco/core";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Chips, Field, Section } from "../components/Form";
import { textDir } from "../components/textDir";
import { orderApi, type OrderApi, type PlaceResult } from "../data/orders";
import { strings, weekdayName } from "../i18n";
import { colors, spacing } from "../theme";

type ErrorKey = Extract<PlaceResult, { ok: false }>["errors"][number];

/** Which form field shows each error; the rest appear above the button. */
const FIELD_OF: Partial<Record<ErrorKey, string>> = {
  "name-missing": "name",
  "phone-invalid": "phone",
  "zone-unknown": "zone",
  "address-invalid": "address",
  "slot-invalid": "slot",
  "cash-not-for-preorder": "payment",
};

interface Props {
  cart: Cart;
  lang: Lang;
  now: Date;
  onBack: () => void;
  onPlaced: (order: { number: string; total: number }) => void;
  api?: OrderApi;
}

export function CheckoutScreen({ cart, lang, now, onBack, onPlaced, api = orderApi }: Props) {
  const t = strings[lang];
  const preorder = canOrderFor(cart.date, now)?.kind === "preorder";
  const [form, setForm] = useState<Omit<OrderRequest, "cart">>({
    name: "",
    phone: "",
    address: { zoneId: "", street: "", building: "", unit: "", note: "" },
    slot: preorder ? DELIVERY_SLOTS[0] : "asap",
    payment: "card",
  });
  const [errors, setErrors] = useState<ErrorKey[]>([]);
  const [sending, setSending] = useState(false);

  const zone = findZone(form.address.zoneId);
  const totals = zone ? cartTotals(cart.lines, zone) : undefined;
  const set = (patch: Partial<typeof form>) => {
    setForm({ ...form, ...patch });
    setErrors([]); // errors refresh on the next submit
  };
  const setAddress = (patch: Partial<OrderRequest["address"]>) =>
    set({ address: { ...form.address, ...patch } });
  const errorFor = (field: string) => {
    const e = errors.find((k) => FIELD_OF[k] === field);
    return e && t.errors[e];
  };
  const generalErrors = errors.filter((k) => !FIELD_OF[k]);

  async function submit() {
    setSending(true);
    const result = await api.place({ ...form, cart });
    setSending(false);
    if (result.ok) onPlaced(result);
    else setErrors(result.errors);
  }

  const payments: PaymentMethod[] = preorder
    ? ["card", "apple_pay"]
    : ["card", "apple_pay", "cash"];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Pressable accessibilityRole="button" onPress={onBack}>
        <Text style={[styles.back, textDir(lang)]}>
          {lang === "ar" ? "→" : "←"} {t.back}
        </Text>
      </Pressable>
      <Text style={[styles.title, textDir(lang)]}>{t.checkout}</Text>
      <Text style={[styles.subtitle, textDir(lang)]}>
        {preorder ? t.preorderTomorrow : t.orderToday} · {weekdayName(cart.date, lang)}
      </Text>

      <Section title={t.contact} lang={lang}>
        <Field
          lang={lang}
          label={t.name}
          value={form.name}
          onChangeText={(name) => set({ name })}
          autoComplete="name"
          error={errorFor("name")}
        />
        <Field
          lang={lang}
          label={t.phone}
          prefix="+974"
          value={form.phone}
          onChangeText={(phone) => set({ phone })}
          keyboardType="phone-pad"
          autoComplete="tel"
          placeholder="5555 1234"
          error={errorFor("phone")}
        />
      </Section>

      <Section title={t.address} lang={lang}>
        <Text style={[styles.label, textDir(lang)]}>{t.zone}</Text>
        <Chips
          lang={lang}
          value={form.address.zoneId}
          onChange={(zoneId) => setAddress({ zoneId })}
          options={ZONES.map((z) => ({ value: z.id, label: z.name[lang] }))}
        />
        {errorFor("zone") && <Text style={[styles.error, textDir(lang)]}>{errorFor("zone")}</Text>}
        <View style={[styles.row, lang === "ar" && styles.rowRtl]}>
          <View style={styles.half}>
            <Field
              lang={lang}
              label={t.street}
              value={form.address.street}
              onChangeText={(street) => setAddress({ street })}
              keyboardType="number-pad"
            />
          </View>
          <View style={styles.half}>
            <Field
              lang={lang}
              label={t.building}
              value={form.address.building}
              onChangeText={(building) => setAddress({ building })}
              keyboardType="number-pad"
            />
          </View>
        </View>
        {errorFor("address") && (
          <Text style={[styles.error, textDir(lang)]}>{errorFor("address")}</Text>
        )}
        <Field
          lang={lang}
          label={t.unit}
          value={form.address.unit}
          onChangeText={(unit) => setAddress({ unit })}
        />
        <Field
          lang={lang}
          label={t.note}
          value={form.address.note}
          onChangeText={(note) => setAddress({ note })}
          multiline
        />
      </Section>

      <Section title={t.when} lang={lang}>
        <Chips
          lang={lang}
          value={form.slot}
          onChange={(slot) => set({ slot })}
          options={[
            ...(preorder ? [] : [{ value: "asap" as const, label: t.asap }]),
            ...DELIVERY_SLOTS.map((s) => ({ value: s, label: s })),
          ]}
        />
        {errorFor("slot") && <Text style={[styles.error, textDir(lang)]}>{errorFor("slot")}</Text>}
      </Section>

      <Section title={t.payment} lang={lang}>
        <Chips
          lang={lang}
          value={form.payment}
          onChange={(payment) => set({ payment })}
          options={payments.map((p) => ({ value: p, label: t.payments[p] }))}
        />
        {errorFor("payment") && (
          <Text style={[styles.error, textDir(lang)]}>{errorFor("payment")}</Text>
        )}
        <Text style={[styles.hint, textDir(lang)]}>{t.sandboxNotice}</Text>
      </Section>

      {totals && (
        <View style={styles.totals}>
          <Line lang={lang} label={t.subtotal} value={t.qar(totals.subtotal)} />
          <Line
            lang={lang}
            label={t.delivery}
            value={totals.delivery ? t.qar(totals.delivery) : t.free}
          />
          <Line lang={lang} label={t.total} value={t.qar(totals.total)} bold />
        </View>
      )}

      {generalErrors.map((e) => (
        <Text key={e} style={[styles.error, styles.general, textDir(lang)]}>
          {t.errors[e]}
        </Text>
      ))}

      <Pressable
        accessibilityRole="button"
        disabled={sending}
        onPress={submit}
        style={[styles.submit, sending && styles.submitDisabled]}
      >
        <Text style={styles.submitText}>
          {sending ? t.sending : totals ? t.placeOrder(t.qar(totals.total)) : t.checkout}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

function Line({
  label,
  value,
  bold,
  lang,
}: {
  label: string;
  value: string;
  bold?: boolean;
  lang: Lang;
}) {
  return (
    <View style={[styles.line, lang === "ar" && styles.rowRtl]}>
      <Text style={[styles.lineText, bold && styles.bold]}>{label}</Text>
      <Text style={[styles.lineText, bold && styles.bold]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.linen },
  content: { padding: spacing(4), paddingTop: spacing(14), paddingBottom: spacing(16) },
  back: { color: colors.indigo, fontWeight: "600" },
  title: { fontSize: 28, fontWeight: "700", color: colors.indigo, marginTop: spacing(3) },
  subtitle: { color: colors.muted, marginTop: spacing(1) },
  label: { color: colors.indigo, marginBottom: spacing(2), fontWeight: "600" },
  row: { flexDirection: "row", gap: spacing(3), marginTop: spacing(3) },
  rowRtl: { flexDirection: "row-reverse" },
  half: { flex: 1 },
  error: { color: colors.bissap, marginTop: spacing(1), fontSize: 13 },
  general: { marginTop: spacing(3) },
  hint: { color: colors.muted, fontSize: 12, marginTop: spacing(2) },
  totals: {
    marginTop: spacing(5),
    padding: spacing(4),
    backgroundColor: colors.white,
    borderRadius: 16,
    gap: spacing(2),
  },
  line: { flexDirection: "row", justifyContent: "space-between" },
  lineText: { color: colors.indigo },
  bold: { fontWeight: "700", fontSize: 16 },
  submit: {
    marginTop: spacing(5),
    backgroundColor: colors.saffron,
    borderRadius: 999,
    paddingVertical: spacing(4),
    alignItems: "center",
  },
  submitDisabled: { opacity: 0.6 },
  submitText: { color: colors.indigo, fontWeight: "700", fontSize: 16 },
});
