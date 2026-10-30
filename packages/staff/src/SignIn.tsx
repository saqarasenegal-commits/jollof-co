import { colors, spacing } from "@jollofco/brand";
import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import type { SessionState } from "./session";

export interface SignInLabels {
  title: string;
  email: string;
  password: string;
  submit: string;
  errors: Record<"wrong-login" | "not-staff" | "network", string>;
}

export const SIGN_IN_EN: SignInLabels = {
  title: "Staff sign-in",
  email: "Email",
  password: "Password",
  submit: "Sign in",
  errors: {
    "wrong-login": "Wrong email or password.",
    "not-staff": "This account has no access to this app. Ask the manager.",
    network: "No connection. Try again.",
  },
};

export const SIGN_IN_FR: SignInLabels = {
  title: "Connexion du personnel",
  email: "E-mail",
  password: "Mot de passe",
  submit: "Se connecter",
  errors: {
    "wrong-login": "E-mail ou mot de passe incorrect.",
    "not-staff": "Ce compte n'a pas accès à cette app. Demandez au responsable.",
    network: "Pas de connexion. Réessayez.",
  },
};

interface Props {
  state: SessionState;
  labels: SignInLabels;
  onSubmit: (email: string, password: string) => void;
}

/** Email + password form. Accounts are created by the owner in Supabase (see docs/STAFF.md). */
export function SignIn({ state, labels, onSubmit }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const busy = state.status === "loading";
  const error = state.status === "signed-out" && state.error ? labels.errors[state.error] : null;

  return (
    <View style={styles.screen}>
      <View style={styles.card}>
        <Text style={styles.title}>{labels.title}</Text>
        <TextInput
          style={styles.input}
          placeholder={labels.email}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder={labels.password}
          secureTextEntry
          autoComplete="current-password"
          value={password}
          onChangeText={setPassword}
          onSubmitEditing={() => onSubmit(email, password)}
        />
        {error && <Text style={styles.error}>{error}</Text>}
        <Pressable
          accessibilityRole="button"
          disabled={busy || !email || !password}
          onPress={() => onSubmit(email, password)}
          style={[styles.button, (busy || !email || !password) && styles.disabled]}
        >
          {busy ? (
            <ActivityIndicator color={colors.indigo} />
          ) : (
            <Text style={styles.buttonText}>{labels.submit}</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.linen,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing(4),
  },
  card: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing(6),
    gap: spacing(3),
  },
  title: { fontSize: 20, fontWeight: "700", color: colors.indigo, marginBottom: spacing(2) },
  input: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    padding: spacing(3),
    fontSize: 16,
    minWidth: 0,
  },
  error: { color: colors.bissap },
  button: {
    backgroundColor: colors.saffron,
    borderRadius: 999,
    padding: spacing(3),
    alignItems: "center",
    marginTop: spacing(2),
  },
  disabled: { opacity: 0.5 },
  buttonText: { color: colors.indigo, fontWeight: "700", fontSize: 16 },
});
