import type { OverallScore, QuestionScore } from "@/lib/types";
import { formatScore } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export function ScoreBreakdown({
  overall,
  questionScores,
  passingScore,
}: {
  overall: OverallScore;
  questionScores?: QuestionScore[];
  passingScore: number | null;
}) {
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
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-xs font-medium uppercase text-muted-foreground">Strengths</p>
              <p className="mt-1 text-sm">{overall.strengths}</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-xs font-medium uppercase text-muted-foreground">Concerns</p>
              <p className="mt-1 text-sm">{overall.concerns}</p>
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
            {questionScores.map((qs) => (
              <div key={qs.questionId} className="rounded-lg border border-border p-4">
                <div className="flex items-start justify-between gap-4">
                  <p className="text-sm font-medium">{qs.promptText}</p>
                  <span className="shrink-0 font-semibold text-primary">
                    {formatScore(qs.score)}
                  </span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{qs.rationale}</p>
                {qs.redFlags.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {qs.redFlags.map((flag) => (
                      <Badge key={flag} variant="destructive">
                        {flag}
                      </Badge>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
