"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useLocale } from "@/lib/use-locale";
import { t } from "@/lib/i18n";
import type { VocabSet } from "@/lib/vocab";

export function VocabSetChrome({ set }: { set: VocabSet }) {
  const { locale } = useLocale();
  const title = (locale === "id" && set.titleId) || set.title;
  const description = (locale === "id" && set.descriptionId) || set.description;
  return (
    <>
      <Link
        href="/vocab"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" /> {t(locale, "vocab_back_all")}
      </Link>
      <header className="mt-4 mb-6">
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="mt-1 text-muted-foreground">{description}</p>
        )}
      </header>
    </>
  );
}
