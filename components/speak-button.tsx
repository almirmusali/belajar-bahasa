"use client";

import { Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { speak } from "@/lib/speak";

export function SpeakButton({ text, className }: { text: string; className?: string }) {
  return (
    <button
      type="button"
      onClick={() => speak(text)}
      title="Прослушать"
      aria-label={`Произнести: ${text}`}
      className={cn(
        "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border bg-background text-muted-foreground transition hover:bg-secondary hover:text-foreground",
        className,
      )}
    >
      <Volume2 className="h-4 w-4" />
    </button>
  );
}
