"use client";

import { useLearned, useMounted } from "@/lib/use-learned";

export function VocabProgress({ slug, total }: { slug: string; total: number }) {
  const mounted = useMounted();
  const { learnedForSet } = useLearned();
  const learned = mounted ? learnedForSet(slug).length : 0;
  const pct = total > 0 ? Math.round((learned / total) * 100) : 0;

  return (
    <div className="mt-3 flex items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded bg-secondary">
        <div
          className="h-full bg-primary transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs tabular-nums text-muted-foreground">
        {learned}/{total}
      </span>
    </div>
  );
}
