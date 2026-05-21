"use client";

import { useEffect, useState } from "react";
import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "./supabase/client";

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [configured, setConfigured] = useState<boolean>(false);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setLoading(false);
      setConfigured(false);
      return;
    }
    setConfigured(true);
    const sb = supabase;

    (async () => {
      const result = await sb.auth.getUser();
      setUser(result.data.user);
      setLoading(false);
    })();

    const sub = sb.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        setUser(session?.user ?? null);
      },
    );

    return () => sub.data.subscription.unsubscribe();
  }, []);

  return { user, loading, configured };
}
