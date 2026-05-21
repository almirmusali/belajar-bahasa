import { SpeakButton } from "./speak-button";

export function Phrase({
  id,
  ru,
  note,
}: {
  id: string;
  ru: string;
  note?: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border bg-card p-4">
      <SpeakButton text={id} className="mt-0.5" />
      <div className="min-w-0 flex-1">
        <div className="font-medium leading-snug">{id}</div>
        <div className="text-sm text-muted-foreground leading-snug">{ru}</div>
        {note && (
          <div className="mt-1 text-xs text-muted-foreground/80 italic">{note}</div>
        )}
      </div>
    </div>
  );
}
