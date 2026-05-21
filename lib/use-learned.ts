"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "./supabase/client";

const KEY = "belajar:learned:v1";
const EVENT = "belajar:learned-changed";

export type LearnedMap = Record<string, string[]>;

function read(): LearnedMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as LearnedMap) : {};
  } catch {
    return {};
  }
}

function write(next: LearnedMap) {
  window.localStorage.setItem(KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(EVENT));
}

async function mergeWithCloud(
  supabase: ReturnType<typeof createSupabaseBrowserClient>,
  userId: string,
) {
  if (!supabase) return;
  const { data: rows } = await supabase
    .from("learned_words")
    .select("set_slug, word_id");
  const remote: LearnedMap = {};
  for (const r of (rows ?? []) as Array<{ set_slug: string; word_id: string }>) {
    if (!remote[r.set_slug]) remote[r.set_slug] = [];
    remote[r.set_slug].push(r.word_id);
  }
  const local = read();
  const merged: LearnedMap = { ...remote };
  const newPushes: Array<{ user_id: string; set_slug: string; word_id: string }> = [];
  for (const [slug, words] of Object.entries(local)) {
    const remoteSet = new Set(remote[slug] ?? []);
    const all = Array.from(new Set([...(remote[slug] ?? []), ...words]));
    merged[slug] = all;
    for (const w of words) {
      if (!remoteSet.has(w))
        newPushes.push({ user_id: userId, set_slug: slug, word_id: w });
    }
  }
  if (newPushes.length > 0) {
    await supabase
      .from("learned_words")
      .upsert(newPushes, { onConflict: "user_id,set_slug,word_id" });
  }
  write(merged);
}

export function useLearned() {
  const [data, setData] = useState<LearnedMap>({});
  const userIdRef = useRef<string | null>(null);

  useEffect(() => {
    setData(read());
    const sync = () => setData(read());
    window.addEventListener(EVENT, sync);

    const supabase = createSupabaseBrowserClient();
    let unsubAuth: (() => void) | null = null;

    if (supabase) {
      const sb = supabase;
      (async () => {
        const { data } = await sb.auth.getUser();
        const u = data.user;
        if (u) {
          userIdRef.current = u.id;
          await mergeWithCloud(sb, u.id);
        }
      })();
      const sub = sb.auth.onAuthStateChange(
        async (event: AuthChangeEvent, session: Session | null) => {
          if (event === "SIGNED_OUT") {
            userIdRef.current = null;
            write({});
          } else if (session?.user && session.user.id !== userIdRef.current) {
            userIdRef.current = session.user.id;
            await mergeWithCloud(sb, session.user.id);
          }
        },
      );
      unsubAuth = () => sub.data.subscription.unsubscribe();
    }

    return () => {
      window.removeEventListener(EVENT, sync);
      unsubAuth?.();
    };
  }, []);

  const isLearned = useCallback(
    (slug: string, id: string) => (data[slug] ?? []).includes(id),
    [data],
  );

  const learnedForSet = useCallback(
    (slug: string) => data[slug] ?? [],
    [data],
  );

  const mark = useCallback((slug: string, id: string) => {
    const next = read();
    const list = next[slug] ?? [];
    if (!list.includes(id)) next[slug] = [...list, id];
    write(next);
    const uid = userIdRef.current;
    if (uid) {
      const sb = createSupabaseBrowserClient();
      if (sb) {
        sb.from("learned_words")
          .upsert(
            { user_id: uid, set_slug: slug, word_id: id },
            { onConflict: "user_id,set_slug,word_id" },
          )
          .then(() => undefined);
      }
    }
  }, []);

  const unmark = useCallback((slug: string, id: string) => {
    const next = read();
    const list = (next[slug] ?? []).filter((x) => x !== id);
    if (list.length === 0) delete next[slug];
    else next[slug] = list;
    write(next);
    const uid = userIdRef.current;
    if (uid) {
      const sb = createSupabaseBrowserClient();
      if (sb) {
        sb.from("learned_words")
          .delete()
          .match({ user_id: uid, set_slug: slug, word_id: id })
          .then(() => undefined);
      }
    }
  }, []);

  const clearSet = useCallback((slug: string) => {
    const next = read();
    delete next[slug];
    write(next);
    const uid = userIdRef.current;
    if (uid) {
      const sb = createSupabaseBrowserClient();
      if (sb) {
        sb.from("learned_words")
          .delete()
          .match({ user_id: uid, set_slug: slug })
          .then(() => undefined);
      }
    }
  }, []);

  const clearAll = useCallback(() => {
    write({});
    const uid = userIdRef.current;
    if (uid) {
      const sb = createSupabaseBrowserClient();
      if (sb) {
        sb.from("learned_words")
          .delete()
          .eq("user_id", uid)
          .then(() => undefined);
      }
    }
  }, []);

  return { data, isLearned, learnedForSet, mark, unmark, clearSet, clearAll };
}

export function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
