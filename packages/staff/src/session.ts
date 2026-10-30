import type { SupabaseClient } from "@supabase/supabase-js";
import { useCallback, useEffect, useState } from "react";

export type StaffRole = "kitchen" | "rider" | "admin";

export interface StaffMember {
  userId: string;
  name: string;
  role: StaffRole;
}

export type SessionState =
  | { status: "loading" }
  | { status: "signed-out"; error?: "wrong-login" | "not-staff" | "network" }
  | { status: "signed-in"; staff: StaffMember };

/** The signed-in person's row in public.staff (RLS lets everyone read their own). */
async function loadStaff(client: SupabaseClient, userId: string): Promise<StaffMember | null> {
  const { data, error } = await client
    .from("staff")
    .select("user_id, name, role")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data ? { userId: data.user_id, name: data.name, role: data.role } : null;
}

/**
 * Sign-in state for a staff app. `allowed` lists the roles that may use this app
 * (admins can use every app). Someone signed in without one of those roles is
 * signed out again with error "not-staff".
 */
export function useStaffSession(client: SupabaseClient, allowed: StaffRole[]) {
  const [state, setState] = useState<SessionState>({ status: "loading" });
  const allowedKey = allowed.join(",");

  const check = useCallback(
    async (userId: string | undefined) => {
      if (!userId) return setState({ status: "signed-out" });
      try {
        const staff = await loadStaff(client, userId);
        if (staff && (staff.role === "admin" || allowedKey.split(",").includes(staff.role))) {
          setState({ status: "signed-in", staff });
        } else {
          await client.auth.signOut();
          setState({ status: "signed-out", error: "not-staff" });
        }
      } catch {
        setState({ status: "signed-out", error: "network" });
      }
    },
    [client, allowedKey],
  );

  useEffect(() => {
    client.auth.getSession().then(({ data }) => check(data.session?.user.id));
    const { data } = client.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT")
        setState((s) => (s.status === "signed-out" ? s : { status: "signed-out" }));
      if (event === "SIGNED_IN") check(session?.user.id);
    });
    return () => data.subscription.unsubscribe();
  }, [client, check]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      setState({ status: "loading" });
      const { error } = await client.auth.signInWithPassword({ email: email.trim(), password });
      if (error) {
        setState({
          status: "signed-out",
          error: error.status === 400 ? "wrong-login" : "network",
        });
      }
      // On success onAuthStateChange("SIGNED_IN") loads the staff row.
    },
    [client],
  );

  const signOut = useCallback(() => client.auth.signOut(), [client]);

  return { state, signIn, signOut };
}
