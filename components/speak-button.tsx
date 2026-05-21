"use client";

import { Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function SpeakButton({ text, className }: { text: string; className?: string }) {
  function speak() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "id-ID";
    utter.rate = 0.95;
    const voices = window.speechSynthesis.getVoices();
    const idVoice = voices.find((v) => v.lang === "id-ID" || v.lang.startsWith("id"));
    if (idVoice) utter.voice = idVoice;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  }

  return (
    <button
      type="button"
      onClick={speak}
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
