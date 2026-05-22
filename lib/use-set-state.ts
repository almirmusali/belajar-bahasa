"use client";

import { useCallback, useEffect, useState } from "react";

const KEY = "belajar:set-state:v1";
const EVENT = "belajar:set-state-changed";

export type SetState = {
  lastWordId?: string;
  lastOpenedAt: number;
};
export type SetStateStore = Record<string, SetState>;

function read(): SetStateStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object"
      ? (parsed as SetStateStore)
      : {};
  } catch {
    return {};
  }
}

function write(next: SetStateStore) {
  window.localStorage.setItem(KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(EVENT));
}

export function useSetState() {
  const [data, setData] = useState<SetStateStore>({});

  useEffect(() => {
    setData(read());
    const sync = () => setData(read());
    window.addEventListener(EVENT, sync);
    return () => window.removeEventListener(EVENT, sync);
  }, []);

  const touch = useCallback((slug: string) => {
    const next = read();
    next[slug] = { ...next[slug], lastOpenedAt: Date.now() };
    write(next);
  }, []);

  const setLastWord = useCallback((slug: string, wordId: string) => {
    const next = read();
    next[slug] = { lastWordId: wordId, lastOpenedAt: Date.now() };
    write(next);
  }, []);

  return { data, touch, setLastWord };
}

// Прямое чтение для синхронного использования в useState инициализаторе
export function readSetState(): SetStateStore {
  return read();
}
