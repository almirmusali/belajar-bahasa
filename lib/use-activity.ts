"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "./supabase/client";

const KEY = "belajar:activity:v1";
const EVENT = "belajar:activity-changed";

export type DayActivity = {
  day: string; // YYYY-MM-DD
  cards: number;
  seconds: number;
};

type LocalState = Record<string, { cards: number; seconds: number }>;

function read(): LocalState {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as LocalState) : {};
  } catch {
    return {};
  }
}

function write(next: LocalState) {
  localStorage.setItem(KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(EVENT));
}

export function todayKey(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

async function mergeWithCloud(
  supabase: ReturnType<typeof createSupabaseBrowserClient>,
  userId: string,
) {
  if (!supabase) return;
  const { data: rows } = await supabase
    .from("study_activity")
    .select("day, cards_viewed, seconds_spent");
  const remote: LocalState = {};
  for (const r of (rows ?? []) as Array<{
    day: string;
    cards_viewed: number;
    seconds_spent: number;
  }>) {
    remote[r.day] = { cards: r.cards_viewed, seconds: r.seconds_spent };
  }
  const local = read();
  const merged: LocalState = { ...remote };
  const toPush: Array<{
    user_id: string;
    day: string;
    cards_viewed: number;
    seconds_spent: number;
  }> = [];
  for (const [day, v] of Object.entries(local)) {
    const r = remote[day];
    const cards = Math.max(r?.cards ?? 0, v.cards);
    const seconds = Math.max(r?.seconds ?? 0, v.seconds);
    merged[day] = { cards, seconds };
    if (!r || r.cards !== cards || r.seconds !== seconds) {
      toPush.push({
        user_id: userId,
        day,
        cards_viewed: cards,
        seconds_spent: seconds,
      });
    }
  }
  if (toPush.length > 0) {
    await supabase
      .from("study_activity")
      .upsert(toPush, { onConflict: "user_id,day" });
  }
  write(merged);
}

let flushTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleCloudFlush(userId: string) {
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(async () => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;
    const state = read();
    const day = todayKey();
    const today = state[day];
    if (!today) return;
    const { error } = await supabase.from("study_activity").upsert(
      {
        user_id: userId,
        day,
        cards_viewed: today.cards,
        seconds_spent: today.seconds,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,day" },
    );
    if (error) console.warn("belajar: не ушло в облако", error);
  }, 4000);
}

export function useActivity() {
  const [state, setState] = useState<LocalState>({});
  const userIdRef = useRef<string | null>(null);

  useEffect(() => {
    setState(read());
    const sync = () => setState(read());
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
        (event: AuthChangeEvent, session: Session | null) => {
          // Колбэк выполняется под внутренним локом supabase-js: любой
          // await supabase.* прямо здесь — взаимоблокировка, после которой
          // виснут все запросы страницы. setTimeout выносит работу из-под лока.
          if (event === "SIGNED_OUT") {
            userIdRef.current = null;
            write({});
          } else if (
            session?.user &&
            session.user.id !== userIdRef.current
          ) {
            const uid = session.user.id;
            userIdRef.current = uid;
            setTimeout(() => void mergeWithCloud(sb, uid), 0);
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

  const addCard = useCallback(() => {
    const next = read();
    const day = todayKey();
    if (!next[day]) next[day] = { cards: 0, seconds: 0 };
    next[day].cards += 1;
    write(next);
    if (userIdRef.current) scheduleCloudFlush(userIdRef.current);
  }, []);

  const addSeconds = useCallback((s: number) => {
    if (s <= 0) return;
    const next = read();
    const day = todayKey();
    if (!next[day]) next[day] = { cards: 0, seconds: 0 };
    next[day].seconds += s;
    write(next);
    if (userIdRef.current) scheduleCloudFlush(userIdRef.current);
  }, []);

  return { activity: state, addCard, addSeconds };
}
