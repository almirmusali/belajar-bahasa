"use client";

import { useCallback, useEffect, useState } from "react";

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

export function useLearned() {
  const [data, setData] = useState<LearnedMap>({});

  useEffect(() => {
    setData(read());
    const sync = () => setData(read());
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", (e) => {
      if (e.key === KEY) sync();
    });
    return () => {
      window.removeEventListener(EVENT, sync);
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
  }, []);

  const unmark = useCallback((slug: string, id: string) => {
    const next = read();
    const list = (next[slug] ?? []).filter((x) => x !== id);
    if (list.length === 0) delete next[slug];
    else next[slug] = list;
    write(next);
  }, []);

  const clearSet = useCallback((slug: string) => {
    const next = read();
    delete next[slug];
    write(next);
  }, []);

  const clearAll = useCallback(() => {
    write({});
  }, []);

  return { data, isLearned, learnedForSet, mark, unmark, clearSet, clearAll };
}

export function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
