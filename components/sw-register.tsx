"use client";

import { useEffect } from "react";

export function SWRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return;

    const onLoad = async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js");

        // При обнаружении новой версии — автоматически активируем её
        reg.addEventListener("updatefound", () => {
          const nw = reg.installing;
          if (!nw) return;
          nw.addEventListener("statechange", () => {
            if (nw.state === "installed") {
              nw.postMessage("SKIP_WAITING");
            }
          });
        });

        // Регулярная проверка обновлений (раз в час)
        setInterval(
          () => {
            reg.update().catch(() => undefined);
          },
          60 * 60 * 1000,
        );
      } catch {}
    };

    window.addEventListener("load", onLoad);
    return () => window.removeEventListener("load", onLoad);
  }, []);
  return null;
}
