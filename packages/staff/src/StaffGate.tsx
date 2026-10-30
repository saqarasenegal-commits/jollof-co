import { colors, spacing } from "@jollofco/brand";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useStaffSession, type StaffMember, type StaffRole } from "./session";
import { SignIn, type SignInLabels } from "./SignIn";

interface Props {
  client: SupabaseClient;
  /** Roles that may use this app (admins always can). */
  allowed: StaffRole[];
  labels: SignInLabels;
  signOutLabel: string;
  children: (staff: StaffMember) => ReactNode;
}

/** Shows the sign-in form until a staff member with the right role is signed in. */
export function StaffGate({ client, allowed, labels, signOutLabel, children }: Props) {
  const { state, signIn, signOut } = useStaffSession(client, allowed);

  if (state.status === "signed-in") {
    return (
      <View style={styles.fill}>
        {children(state.staff)}
        <View style={styles.bar}>
          <Text style={styles.who}>{state.staff.name}</Text>
          <Pressable accessibilityRole="button" onPress={signOut}>
            <Text style={styles.signOut}>{signOutLabel}</Text>
          </Pressable>
        </View>
      </View>
    );
  }
  return <SignIn state={state} labels={labels} onSubmit={signIn} />;
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  bar: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: spacing(3),
    paddingHorizontal: spacing(4),
    paddingVertical: spacing(2),
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  who: { color: colors.muted },
  signOut: { color: colors.indigo, fontWeight: "700" },
});
