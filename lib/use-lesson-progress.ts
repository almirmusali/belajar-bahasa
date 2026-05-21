"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "./supabase/client";

const KEY = "belajar:lessons-done:v1";
const EVENT = "belajar:lessons-changed";

function read(): number[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? (parsed as unknown[]).filter((n): n is number => typeof n === "number")
      : [];
  } catch {
    return [];
  }
}

function write(next: number[]) {
  window.localStorage.setItem(KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(EVENT));
}

async function mergeWithCloud(
  supabase: ReturnType<typeof createSupabaseBrowserClient>,
  userId: string,
) {
  if (!supabase) return;
  const { data: rows } = await supabase
    .from("lesson_progress")
    .select("lesson_id");
  const remote: number[] = ((rows ?? []) as Array<{ lesson_id: number }>).map(
    (r) => r.lesson_id,
  );
  const local = read();
  const merged = Array.from(new Set([...remote, ...local])).sort((a, b) => a - b);
  const newPushes = local.filter((l) => !remote.includes(l));
  if (newPushes.length > 0) {
    await supabase
      .from("lesson_progress")
      .upsert(
        newPushes.map((l) => ({ user_id: userId, lesson_id: l })),
        { onConflict: "user_id,lesson_id" },
      );
  }
  write(merged);
}

export function useLessonProgress() {
  const [completed, setCompleted] = useState<number[]>([]);
  const userIdRef = useRef<string | null>(null);

  useEffect(() => {
    setCompleted(read());
    const sync = () => setCompleted(read());
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
            write([]);
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

  const isComplete = useCallback(
    (id: number) => completed.includes(id),
    [completed],
  );

  const markComplete = useCallback((id: number) => {
    const cur = read();
    if (cur.includes(id)) return;
    const next = [...cur, id].sort((a, b) => a - b);
    write(next);
    const uid = userIdRef.current;
    if (uid) {
      const sb = createSupabaseBrowserClient();
      if (sb) {
        sb.from("lesson_progress")
          .upsert(
            { user_id: uid, lesson_id: id },
            { onConflict: "user_id,lesson_id" },
          )
          .then(() => undefined);
      }
    }
  }, []);

  const unmarkComplete = useCallback((id: number) => {
    const cur = read();
    if (!cur.includes(id)) return;
    write(cur.filter((x) => x !== id));
    const uid = userIdRef.current;
    if (uid) {
      const sb = createSupabaseBrowserClient();
      if (sb) {
        sb.from("lesson_progress")
          .delete()
          .match({ user_id: uid, lesson_id: id })
          .then(() => undefined);
      }
    }
  }, []);

  return { completed, isComplete, markComplete, unmarkComplete };
}
