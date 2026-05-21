"use client";

import { useLocale } from "@/lib/use-locale";
import { t } from "@/lib/i18n";

function FlagID({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 6 4"
      className={className}
      aria-hidden="true"
    >
      <rect width="6" height="2" fill="#dc2626" />
      <rect y="2" width="6" height="2" fill="#fff" />
    </svg>
  );
}

function FlagRU({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 9 6"
      className={className}
      aria-hidden="true"
    >
      <rect width="9" height="2" fill="#fff" />
      <rect y="2" width="9" height="2" fill="#0033A0" />
      <rect y="4" width="9" height="2" fill="#DA291C" />
    </svg>
  );
}

export function LocaleSwitcher() {
  const { locale, toggleLocale } = useLocale();
  const isRU = locale === "ru";
  const nextLocaleLabel = isRU ? "Bahasa Indonesia" : "Русский";

  return (
    <button
      type="button"
      onClick={toggleLocale}
      title={t(locale, "switch_lang_title") + " → " + nextLocaleLabel}
      aria-label={t(locale, "switch_lang_title")}
      className="inline-flex h-7 w-9 items-center justify-center overflow-hidden rounded-md border bg-background transition hover:scale-105 hover:border-foreground"
    >
      {isRU ? (
        <FlagID className="h-full w-full" />
      ) : (
        <FlagRU className="h-full w-full" />
      )}
    </button>
  );
}
