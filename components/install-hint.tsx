"use client";

import { useEffect, useState } from "react";
import { Share, X, Download } from "lucide-react";

const DISMISS_KEY = "belajar:install-hint:dismissed:v1";
type BIP = Event & { prompt: () => void; userChoice: Promise<{ outcome: string }> };

export function InstallHint() {
  const [platform, setPlatform] = useState<"ios" | "android" | "other" | null>(
    null,
  );
  const [dismissed, setDismissed] = useState(true);
  const [bip, setBip] = useState<BIP | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // @ts-expect-error iOS Safari quirk
      window.navigator.standalone === true;
    if (standalone) return; // уже установлено

    const ua = window.navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua) && !("MSStream" in window);
    const isAndroid = /Android/.test(ua);
    const platform: "ios" | "android" | "other" = isIOS
      ? "ios"
      : isAndroid
        ? "android"
        : "other";
    setPlatform(platform);

    const wasDismissed = window.localStorage.getItem(DISMISS_KEY) === "1";
    setDismissed(wasDismissed);

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setBip(e as BIP);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    return () =>
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, []);

  function dismiss() {
    window.localStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  }

  if (dismissed || platform === null || platform === "other") return null;
  if (platform === "android" && !bip) return null; // нет сигнала установить

  return (
    <div className="fixed inset-x-0 bottom-2 z-50 px-3 sm:bottom-4">
      <div className="mx-auto flex max-w-md items-start gap-3 rounded-2xl border bg-card p-3 shadow-lg">
        <div className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Download className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1 text-sm leading-snug">
          {platform === "ios" ? (
            <>
              <div className="font-semibold">Установить на iPhone</div>
              <div className="mt-0.5 text-muted-foreground">
                Нажми{" "}
                <Share className="inline h-3.5 w-3.5 align-text-bottom" />{" "}
                «Поделиться» в Safari, затем «На экран Домой».
              </div>
            </>
          ) : (
            <>
              <div className="font-semibold">Установить приложение</div>
              <div className="mt-0.5 text-muted-foreground">
                Сохрани Belajar как приложение прямо из браузера.
              </div>
              <button
                type="button"
                onClick={async () => {
                  bip?.prompt();
                  const res = await bip?.userChoice;
                  if (res?.outcome === "accepted") setBip(null);
                }}
                className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
              >
                <Download className="h-3.5 w-3.5" /> Установить
              </button>
            </>
          )}
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Скрыть"
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
