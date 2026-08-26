"use client";

import Link from "next/link";
import {
  BookOpen,
  GraduationCap,
  Library,
  Lock,
  RefreshCw,
  Zap,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { useLocale } from "@/lib/use-locale";
import { t } from "@/lib/i18n";

export function Landing() {
  const { locale } = useLocale();
  return (
    <>
      <SiteHeader />
      <main className="container mx-auto max-w-4xl px-4 py-12">
        <section className="mx-auto max-w-2xl text-center">
          <span className="rounded-full border px-3 py-1 text-xs uppercase tracking-widest text-muted-foreground">
            {t(locale, "home_badge")}
          </span>
          <h1 className="mt-4 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            {t(locale, "landing_title")}
          </h1>
          <p className="mt-4 text-balance text-muted-foreground sm:text-lg">
            {t(locale, "landing_subtitle")}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/signup"
              className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              {t(locale, "landing_cta_signup")}
            </Link>
            <Link
              href="/login"
              className="rounded-md border px-5 py-2.5 text-sm font-medium hover:bg-secondary"
            >
              {t(locale, "landing_cta_login")}
            </Link>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            {t(locale, "landing_free_note")}
          </p>
        </section>

        <section className="mt-12 grid gap-3 sm:grid-cols-2">
          <Feature
            icon={<GraduationCap className="h-5 w-5" />}
            title={t(locale, "landing_feat_lessons_title")}
            text={t(locale, "landing_feat_lessons_text")}
            locked={t(locale, "landing_locked_badge")}
          />
          <Feature
            icon={<BookOpen className="h-5 w-5" />}
            title={t(locale, "landing_feat_reading_title")}
            text={t(locale, "landing_feat_reading_text")}
            locked={t(locale, "landing_locked_badge")}
          />
          <Feature
            icon={<Library className="h-5 w-5" />}
            title={t(locale, "landing_feat_vocab_title")}
            text={t(locale, "landing_feat_vocab_text")}
            href="/vocab"
          />
          <Feature
            icon={<Zap className="h-5 w-5" />}
            title={t(locale, "landing_feat_express_title")}
            text={t(locale, "landing_feat_express_text")}
            href="/express"
          />
          <div className="sm:col-span-2">
            <Feature
              icon={<RefreshCw className="h-5 w-5" />}
              title={t(locale, "landing_feat_progress_title")}
              text={t(locale, "landing_feat_progress_text")}
            />
          </div>
        </section>

        <section className="mt-10 text-center">
          <Link
            href="/vocab"
            className="text-sm font-medium text-primary hover:underline"
          >
            {t(locale, "landing_try_vocab")} →
          </Link>
        </section>
      </main>
    </>
  );
}

function Feature({
  icon,
  title,
  text,
  href,
  locked,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  href?: string;
  locked?: string;
}) {
  const body = (
    <div className="h-full rounded-xl border bg-card p-5 transition hover:border-primary">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 font-semibold">
          <span className="text-primary">{icon}</span> {title}
        </div>
        {locked && (
          <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
            <Lock className="h-3 w-3" /> {locked}
          </span>
        )}
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{text}</p>
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}
