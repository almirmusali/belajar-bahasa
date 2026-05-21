"use client";

import { useMemo } from "react";
import Link from "next/link";
import { BookOpen, GraduationCap, Library, Lock } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { useUser } from "@/lib/use-user";
import { useLearned, useMounted } from "@/lib/use-learned";
import { useLessonProgress } from "@/lib/use-lesson-progress";
import { useLocale } from "@/lib/use-locale";
import { t } from "@/lib/i18n";
import type { VocabSet } from "@/lib/vocab";
import { lessons as allLessons } from "@/lib/lessons";

export function AccountDashboard({ sets }: { sets: VocabSet[] }) {
  const mounted = useMounted();
  const { user, loading, configured } = useUser();
  const { locale } = useLocale();
  const { data: learned } = useLearned();
  const { completed: lessonsDone } = useLessonProgress();

  const totalLearned = useMemo(
    () =>
      Object.values(learned).reduce(
        (acc: number, arr) => acc + (arr?.length ?? 0),
        0,
      ),
    [learned],
  );
  const activeSets = useMemo(
    () => Object.keys(learned).filter((k) => (learned[k] ?? []).length > 0).length,
    [learned],
  );
  const lessonsTotal = allLessons.filter((l) => l.available).length || 1;

  if (loading) {
    return (
      <>
        <SiteHeader />
        <main className="container mx-auto max-w-3xl px-4 py-10 text-center text-muted-foreground">
          ...
        </main>
      </>
    );
  }

  if (!configured) {
    return (
      <>
        <SiteHeader />
        <main className="container mx-auto max-w-2xl px-4 py-10">
          <div className="rounded-2xl border bg-card p-8 text-center">
            <Lock className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-lg font-medium">
              {t(locale, "auth_not_configured")}
            </p>
          </div>
        </main>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <SiteHeader />
        <main className="container mx-auto max-w-2xl px-4 py-10">
          <div className="rounded-2xl border bg-card p-8 text-center">
            <Lock className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-4 text-lg font-medium">
              {t(locale, "account_local_only_warning")}
            </p>
            <div className="mt-5 flex justify-center gap-3">
              <Link
                href="/login"
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                {t(locale, "auth_login_submit")}
              </Link>
              <Link
                href="/signup"
                className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-secondary"
              >
                {t(locale, "auth_signup_submit")}
              </Link>
            </div>
          </div>
        </main>
      </>
    );
  }

  const createdAt = user.created_at
    ? new Date(user.created_at).toLocaleDateString(locale === "ru" ? "ru-RU" : "id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <>
      <SiteHeader />
      <main className="container mx-auto max-w-3xl px-4 py-10">
        <header>
          <h1 className="text-3xl font-bold tracking-tight">
            {t(locale, "account_title")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t(locale, "account_signed_in_as")}{" "}
            <span className="font-medium text-foreground">{user.email}</span>
            {createdAt && (
              <>
                {" · "}
                {t(locale, "account_member_since")} {createdAt}
              </>
            )}
          </p>
        </header>

        <section className="mt-6 grid gap-3 sm:grid-cols-3">
          <Stat
            icon={<BookOpen className="h-5 w-5" />}
            label={t(locale, "account_stats_words")}
            value={mounted ? totalLearned : 0}
          />
          <Stat
            icon={<GraduationCap className="h-5 w-5" />}
            label={t(locale, "account_stats_lessons")}
            value={`${mounted ? lessonsDone.length : 0} / ${lessonsTotal}`}
          />
          <Stat
            icon={<Library className="h-5 w-5" />}
            label={t(locale, "account_stats_sets")}
            value={mounted ? activeSets : 0}
          />
        </section>

        <section className="mt-10">
          <h2 className="text-lg font-semibold">
            {t(locale, "account_vocab_progress_title")}
          </h2>
          <ul className="mt-3 space-y-2">
            {sets
              .map((s) => {
                const title =
                  (locale === "id" && s.titleId) || s.title;
                const learnedCount = mounted
                  ? (learned[s.slug] ?? []).length
                  : 0;
                const pct = s.words.length
                  ? Math.round((learnedCount / s.words.length) * 100)
                  : 0;
                return { s, title, learnedCount, pct };
              })
              .sort((a, b) => b.learnedCount - a.learnedCount)
              .map(({ s, title, learnedCount, pct }) => (
                <li key={s.slug}>
                  <Link
                    href={`/vocab/${s.slug}`}
                    className="block rounded-lg border bg-card p-3 transition hover:border-primary"
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="truncate font-medium">{title}</span>
                      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                        {learnedCount} / {s.words.length} · {pct}%
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded bg-secondary">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </Link>
                </li>
              ))}
          </ul>
        </section>

        <section className="mt-10">
          <h2 className="text-lg font-semibold">
            {t(locale, "account_lesson_progress_title")}
          </h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {allLessons.map((l) => {
              const done = mounted && lessonsDone.includes(l.id);
              return (
                <Link
                  key={l.id}
                  href={`/lessons/${l.id}`}
                  className="flex items-center gap-3 rounded-lg border bg-card p-3 transition hover:border-primary"
                >
                  <div
                    className={
                      done
                        ? "inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600"
                        : "inline-flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-muted-foreground"
                    }
                  >
                    {done ? "✓" : l.id}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">
                      {l.title}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </main>
    </>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
        <span className="text-primary">{icon}</span> {label}
      </div>
      <div className="mt-2 text-3xl font-bold tabular-nums">{value}</div>
    </div>
  );
}
