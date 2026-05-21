"use client";

import { useEffect } from "react";
import { useActivity } from "@/lib/use-activity";

// Считает время, проведённое на странице с карточками.
// Тикает каждые 10 секунд, пауза при visibility:hidden.
export function ActivityTracker() {
  const { addSeconds } = useActivity();

  useEffect(() => {
    if (typeof document === "undefined") return;

    let active = document.visibilityState !== "hidden";
    let lastTick = Date.now();

    const tick = () => {
      if (!active) return;
      const now = Date.now();
      const elapsed = Math.round((now - lastTick) / 1000);
      lastTick = now;
      // Игнорируем подозрительно большие скачки (вкладка была неактивна, но события не пришли)
      if (elapsed > 0 && elapsed < 120) {
        addSeconds(elapsed);
      }
    };

    const interval = setInterval(tick, 10_000);

    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        tick();
        active = false;
      } else {
        active = true;
        lastTick = Date.now();
      }
    };

    const onBeforeUnload = () => tick();

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("beforeunload", onBeforeUnload);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("beforeunload", onBeforeUnload);
      tick();
    };
  }, [addSeconds]);

  return null;
}
