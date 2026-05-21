"use client";

import { useCallback, useEffect, useState } from "react";

export type Locale = "ru" | "id";
const KEY = "belajar:locale:v1";
const EVENT = "belajar:locale-changed";

function read(): Locale {
  if (typeof window === "undefined") return "ru";
  return window.localStorage.getItem(KEY) === "id" ? "id" : "ru";
}

function write(l: Locale) {
  window.localStorage.setItem(KEY, l);
  window.dispatchEvent(new Event(EVENT));
}

export function useLocale() {
  const [locale, setLocale] = useState<Locale>("ru");

  useEffect(() => {
    setLocale(read());
    const sync = () => setLocale(read());
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", (e) => {
      if (e.key === KEY) sync();
    });
    return () => window.removeEventListener(EVENT, sync);
  }, []);

  const set = useCallback((l: Locale) => {
    write(l);
    setLocale(l);
  }, []);

  const toggle = useCallback(() => {
    const next: Locale = read() === "ru" ? "id" : "ru";
    write(next);
    setLocale(next);
  }, []);

  return { locale, setLocale: set, toggleLocale: toggle };
}
