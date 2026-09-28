import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type Profile = {
  id: string;
  display_name: string;
  avatar_url: string | null;
};

export type StaffRole = "admin" | "intern" | "captain" | "member";

type AuthValue = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: StaffRole;
  isAdmin: boolean;
  isIntern: boolean;
  /** Team captain — may only edit team rosters. */
  isCaptain: boolean;
  /** Admin or intern — anyone who may reach the control room. */
  isStaff: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthValue>({
  user: null,
  session: null,
  profile: null,
  role: "member",
  isAdmin: false,
  isIntern: false,
  isCaptain: false,
  isStaff: false,
  loading: true,
  refresh: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<StaffRole>("member");
  const [loading, setLoading] = useState(true);

  async function loadExtras(userId: string | undefined) {
    if (!userId) {
      setProfile(null);
      setRole("member");
      return;
    }
    const [{ data: p }, { data: roles }] = await Promise.all([
      supabase.from("profiles").select("id, display_name, avatar_url").eq("id", userId).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", userId),
    ]);
    setProfile((p as Profile) ?? null);
    const list = (roles ?? []).map((r) => String(r.role));
    setRole(
      list.includes("admin")
        ? "admin"
        : list.includes("intern")
          ? "intern"
          : list.includes("captain")
            ? "captain"
            : "member",
    );
  }

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setTimeout(() => {
        void loadExtras(newSession?.user?.id);
      }, 0);
    });

    void supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      await loadExtras(data.session?.user?.id);
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const value = useMemo<AuthValue>(
    () => ({
      user: session?.user ?? null,
      session,
      profile,
      role,
      isAdmin: role === "admin",
      isIntern: role === "intern",
      isCaptain: role === "captain",
      isStaff: role === "admin" || role === "intern",
      loading,
      refresh: async () => {
        const { data } = await supabase.auth.getSession();
        setSession(data.session);
        await loadExtras(data.session?.user?.id);
      },
    }),
    [session, profile, role, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
