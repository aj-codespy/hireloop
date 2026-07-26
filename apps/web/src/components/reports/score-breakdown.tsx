import type { OverallScore, QuestionScore, TranscriptEntry } from "@/lib/types";
import { formatScore } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PhosphorIcon } from "@/components/icons/phosphor-icon";

export function ScoreBreakdown({
  overall,
  questionScores,
  passingScore,
  transcript,
}: {
  overall: OverallScore;
  questionScores?: QuestionScore[];
  passingScore: number | null;
  transcript?: TranscriptEntry[];
}) {
  const renderBullets = (text: string) => {
    if (!text) return null;
    const items = text.split(/(?<=\.)\s+/).filter((s) => s.trim().length > 0);
    if (items.length <= 1) return <p className="mt-1 text-sm">{text}</p>;
    return (
      <ul className="mt-1 list-inside list-disc text-sm space-y-1">
        {items.map((item, idx) => (
          <li key={idx} className="leading-relaxed">
            {item}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Overall score</CardTitle>
            <Badge variant={overall.pass ? "default" : "destructive"}>
              {overall.pass ? "Pass" : "Fail"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end gap-2">
            <span className="text-4xl font-bold text-brand">
              {formatScore(overall.totalScore)}
            </span>
            <span className="mb-1 text-sm text-muted-foreground">
              {passingScore != null
                ? `threshold ${passingScore.toFixed(1)}`
                : "no score threshold configured"}
            </span>
          </div>
          <Progress value={(overall.totalScore / 10) * 100} className="h-2" />
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg bg-muted/50 p-4">
              <p className="text-xs font-medium uppercase text-muted-foreground mb-2">Strengths</p>
              {renderBullets(overall.strengths)}
            </div>
            <div className="rounded-lg bg-muted/50 p-4">
              <p className="text-xs font-medium uppercase text-muted-foreground mb-2">Concerns</p>
              {renderBullets(overall.concerns)}
            </div>
          </div>
        </CardContent>
      </Card>

      {questionScores?.length ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Per-question scores</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {questionScores.map((qs) => {
              const answer = transcript?.find(
                (t) => t.questionId === qs.questionId && t.speaker === "candidate"
              )?.text;

              return (
                <div key={qs.questionId} className="rounded-lg border border-border overflow-hidden">
                  <div className="p-4 bg-muted/30">
                    <div className="flex items-start justify-between gap-4">
                      <p className="text-sm font-medium">{qs.promptText}</p>
                      <span className="shrink-0 font-semibold text-primary text-lg">
                        {formatScore(qs.score)}
                      </span>
                    </div>
                  </div>

                  {answer && (
                    <div className="px-4 py-3 border-t border-border/50 bg-background flex gap-3">
                      <PhosphorIcon name="Quote" className="h-4 w-4 text-muted-foreground/40 shrink-0 mt-0.5" />
                      <p className="text-sm italic text-muted-foreground/90">{answer}</p>
                    </div>
                  )}

                  <div className="px-4 py-3 border-t border-border/50 bg-background">
                    <p className="text-xs font-medium uppercase text-muted-foreground mb-1">AI Reasoning</p>
                    {renderBullets(qs.rationale)}

                    {qs.redFlags.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {qs.redFlags.map((flag) => (
                          <Badge key={flag} variant="destructive" className="px-2 py-0.5 text-xs font-normal">
                            {flag}
                          </Badge>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
