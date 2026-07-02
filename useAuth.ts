// ─────────────────────────────────────────────────────────────
// useAuth — Supabase auth hook
// Handles: signIn, signOut, session persistence, role from profiles
// ─────────────────────────────────────────────────────────────

import { useState, useEffect } from "react";
import { supabase } from "./useSupabase";
import type { Role } from "./types";

interface AuthState {
  userId:  string | null;
  role:    Role | null;
  loading: boolean;
  error:   string | null;
}

interface UseAuthReturn extends AuthState {
  signIn:  (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [state, setState] = useState<AuthState>({
    userId:  null,
    role:    null,
    loading: true,
    error:   null,
  });

  // ── Fetch role from profiles table ───────────────────────
  const fetchRole = async (userId: string): Promise<Role> => {
    try {
      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .maybeSingle();

      if (!data?.role) {
        // No profile row — create one with default manager role
        await supabase
          .from("profiles")
          .upsert({ id: userId, role: "manager" }, { onConflict: "id" });
        return "manager";
      }
      return data.role as Role;
    } catch {
      return "manager";
    }
  };

  // ── Bootstrap auth on mount ───────────────────────────────
  useEffect(() => {
    let cancelled = false;

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (cancelled) return;
      if (session?.user) {
        const role = await fetchRole(session.user.id);
        if (!cancelled)
          setState({ userId: session.user.id, role, loading: false, error: null });
      } else {
        setState({ userId: null, role: null, loading: false, error: null });
      }
    });

    // Only listen for SIGNED_OUT and TOKEN_REFRESHED — not SIGNED_IN
    // (SIGNED_IN on mount duplicates getSession and can race/clear state)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (cancelled) return;
        if (event === "SIGNED_OUT") {
          setState({ userId: null, role: null, loading: false, error: null });
        } else if (event === "SIGNED_IN" && session?.user) {
          const role = await fetchRole(session.user.id);
          if (!cancelled)
            setState({ userId: session.user.id, role, loading: false, error: null });
        } else if (event === "TOKEN_REFRESHED" && session?.user) {
          // Keep existing role, just refresh userId if needed
          setState(s => s.userId ? s : { userId: session.user.id, role: "manager", loading: false, error: null });
        }
      }
    );

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  // ── Sign in ───────────────────────────────────────────────
  const signIn = async (
    email: string,
    password: string
  ): Promise<string | null> => {
    setState(s => ({ ...s, loading: true, error: null }));

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setState(s => ({ ...s, loading: false, error: error.message }));
      return error.message;
    }

    return null; // onAuthStateChange handles the rest
  };

  // ── Sign out ──────────────────────────────────────────────
  const signOut = async (): Promise<void> => {
    await supabase.auth.signOut();
  };

  return { ...state, signIn, signOut };
}
