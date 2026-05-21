"use client";

import { useMemo, useState } from "react";
import { BookOpen, Clock, BarChart3 } from "lucide-react";
import { useActivity } from "@/lib/use-activity";
import { useMounted } from "@/lib/use-learned";
import { useLocale } from "@/lib/use-locale";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

function dayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDuration(
  seconds: number,
  L: (k: "stats_h" | "stats_min" | "stats_sec") => string,
): string {
  if (seconds < 60) return `${seconds} ${L("stats_sec")}`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} ${L("stats_min")}`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest
    ? `${hours} ${L("stats_h")} ${rest} ${L("stats_min")}`
    : `${hours} ${L("stats_h")}`;
}

export function StatsDashboard() {
  const mounted = useMounted();
  const { activity } = useActivity();
  const { locale } = useLocale();
  const [view, setView] = useState<"cards" | "time">("cards");

  const L = (k: "stats_h" | "stats_min" | "stats_sec") => t(locale, k);

  const { todayStats, weekStats, monthStats, last7, hasAny } = useMemo(() => {
    if (!mounted) {
      return {
        todayStats: { cards: 0, seconds: 0 },
        weekStats: { cards: 0, seconds: 0 },
        monthStats: { cards: 0, seconds: 0 },
        last7: [] as Array<{ day: string; date: Date; cards: number; seconds: number }>,
        hasAny: false,
      };
    }
    const today = new Date();
    const todayK = dayKey(today);
    const todayStats = activity[todayK] ?? { cards: 0, seconds: 0 };

    let weekCards = 0;
    let weekSeconds = 0;
    let monthCards = 0;
    let monthSeconds = 0;
    const last7: Array<{ day: string; date: Date; cards: number; seconds: number }> = [];

    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const k = dayKey(d);
      const v = activity[k] ?? { cards: 0, seconds: 0 };
      if (i < 7) {
        weekCards += v.cards;
        weekSeconds += v.seconds;
      }
      monthCards += v.cards;
      monthSeconds += v.seconds;
      if (i < 7) last7.push({ day: k, date: d, cards: v.cards, seconds: v.seconds });
    }

    last7.reverse(); // от старого к новому

    const hasAny = Object.values(activity).some((v) => v.cards > 0 || v.seconds > 0);
    return {
      todayStats,
      weekStats: { cards: weekCards, seconds: weekSeconds },
      monthStats: { cards: monthCards, seconds: monthSeconds },
      last7,
      hasAny,
    };
  }, [activity, mounted]);

  const max = useMemo(() => {
    if (last7.length === 0) return 1;
    const vals = last7.map((d) => (view === "cards" ? d.cards : d.seconds));
    return Math.max(1, ...vals);
  }, [last7, view]);

  const dayLabel = (date: Date) =>
    new Intl.DateTimeFormat(locale === "ru" ? "ru-RU" : "id-ID", {
      weekday: "short",
    }).format(date);

  return (
    <section className="mx-auto mt-10 max-w-4xl">
      <div className="rounded-2xl border bg-card p-4 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <h2 className="text-base font-semibold sm:text-lg">
              {t(locale, "stats_title")}
            </h2>
          </div>
          <div className="flex gap-1 rounded-md border p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setView("cards")}
              className={cn(
                "rounded px-2 py-1 transition",
                view === "cards"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t(locale, "stats_view_cards")}
            </button>
            <button
              type="button"
              onClick={() => setView("time")}
              className={cn(
                "rounded px-2 py-1 transition",
                view === "time"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t(locale, "stats_view_time")}
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
          <Stat
            label={t(locale, "stats_today")}
            cards={todayStats.cards}
            seconds={todayStats.seconds}
            L={L}
          />
          <Stat
            label={t(locale, "stats_week")}
            cards={weekStats.cards}
            seconds={weekStats.seconds}
            L={L}
          />
          <Stat
            label={t(locale, "stats_month")}
            cards={monthStats.cards}
            seconds={monthStats.seconds}
            L={L}
          />
        </div>

        <div className="mt-5">
          <div className="mb-2 text-xs text-muted-foreground">
            {t(locale, "stats_last_7_days")}
          </div>
          <div className="flex items-end justify-between gap-1.5 sm:gap-3">
            {last7.map((d) => {
              const value = view === "cards" ? d.cards : d.seconds;
              const pct = (value / max) * 100;
              const isToday = dayKey(d.date) === dayKey(new Date());
              return (
                <div
                  key={d.day}
                  className="flex flex-1 flex-col items-center gap-1"
                >
                  <div
                    className="w-full overflow-hidden rounded-md bg-secondary"
                    style={{ height: 72 }}
                    title={
                      view === "cards"
                        ? `${value} ${t(locale, "stats_cards_short")}`
                        : formatDuration(value, L)
                    }
                  >
                    <div
                      className={cn(
                        "ml-0 mt-auto w-full bg-primary transition-all",
                        value === 0 && "opacity-30",
                      )}
                      style={{
                        height: `${value > 0 ? Math.max(6, pct) : 0}%`,
                        marginTop: `${100 - (value > 0 ? Math.max(6, pct) : 0)}%`,
                      }}
                    />
                  </div>
                  <div
                    className={cn(
                      "text-[10px] capitalize",
                      isToday
                        ? "font-semibold text-foreground"
                        : "text-muted-foreground",
                    )}
                  >
                    {dayLabel(d.date)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {!hasAny && (
          <p className="mt-4 text-center text-xs text-muted-foreground">
            {t(locale, "stats_no_activity")}
          </p>
        )}
      </div>
    </section>
  );
}

function Stat({
  label,
  cards,
  seconds,
  L,
}: {
  label: string;
  cards: number;
  seconds: number;
  L: (k: "stats_h" | "stats_min" | "stats_sec") => string;
}) {
  return (
    <div className="rounded-xl border bg-background p-3 sm:p-4">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-2 flex items-center gap-1.5 text-xl font-bold tabular-nums sm:text-2xl">
        <BookOpen className="h-4 w-4 text-primary" />
        {cards}
      </div>
      <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground tabular-nums">
        <Clock className="h-3.5 w-3.5" />
        {formatDuration(seconds, L)}
      </div>
    </div>
  );
}
