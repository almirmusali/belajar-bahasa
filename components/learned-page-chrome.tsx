"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useLocale } from "@/lib/use-locale";
import { t } from "@/lib/i18n";

export function LearnedPageChrome() {
  const { locale } = useLocale();
  return (
    <>
      <Link
        href="/vocab"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" /> {t(locale, "vocab_back_all")}
      </Link>
      <header className="mt-4">
        <h1 className="text-3xl font-bold tracking-tight">
          {t(locale, "learned_title")}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {t(locale, "learned_subtitle")}
        </p>
      </header>
    </>
  );
}
