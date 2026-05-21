"use client";

import { Check, RotateCcw } from "lucide-react";
import { useMounted } from "@/lib/use-learned";
import { useLessonProgress } from "@/lib/use-lesson-progress";
import { useLocale } from "@/lib/use-locale";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function LessonCompleteButton({ lessonId }: { lessonId: number }) {
  const mounted = useMounted();
  const { locale } = useLocale();
  const { isComplete, markComplete, unmarkComplete } = useLessonProgress();
  const done = mounted && isComplete(lessonId);

  return (
    <div className="mt-10 flex flex-col items-center gap-2 rounded-xl border bg-card p-6 text-center">
      {done ? (
        <>
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600">
            <Check className="h-5 w-5" />
          </div>
          <p className="text-base font-semibold">
            {t(locale, "lesson_completed")}
          </p>
          <button
            type="button"
            onClick={() => unmarkComplete(lessonId)}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="h-3 w-3" /> {t(locale, "lesson_mark_incomplete")}
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={() => markComplete(lessonId)}
          className={cn(
            "inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90",
          )}
        >
          <Check className="h-4 w-4" /> {t(locale, "lesson_mark_complete")}
        </button>
      )}
    </div>
  );
}

export function LessonCheckmark({ lessonId }: { lessonId: number }) {
  const mounted = useMounted();
  const { isComplete } = useLessonProgress();
  if (!mounted || !isComplete(lessonId)) return null;
  return (
    <span
      title="Урок пройден"
      className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600"
    >
      <Check className="h-3 w-3" />
    </span>
  );
}
