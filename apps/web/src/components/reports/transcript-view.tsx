import type { TranscriptEntry } from "@/lib/types";
import { formatSeconds } from "@/lib/format";
import { ScrollArea } from "@/components/ui/scroll-area";

export function TranscriptView({ entries }: { entries: TranscriptEntry[] }) {
  return (
    <ScrollArea className="h-[400px] rounded-xl border border-border bg-card p-4">
      <div className="space-y-3">
        {entries.map((entry, i) => (
          <div
            key={i}
            className={
              entry.speaker === "ai"
                ? "rounded-lg border-l-2 border-primary bg-muted/40 p-3"
                : "rounded-lg border-l-2 border-emerald-600 bg-emerald-50/50 p-3"
            }
          >
            <div className="mb-1 flex items-center justify-between text-[11px] uppercase tracking-wide text-muted-foreground">
              <span>{entry.speaker === "ai" ? "Interviewer" : "Candidate"}</span>
              <span>{formatSeconds(Math.round(entry.timestampOffsetSeconds))}</span>
            </div>
            <p className="text-sm leading-relaxed">{entry.text}</p>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
