"use client";

import { format } from "date-fns";
import { useScorecardsForApplication } from "@/lib/store/provider";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Scorecard, ScorecardRecommendation } from "@/lib/types";

const RECOMMENDATION_LABELS: Record<ScorecardRecommendation, string> = {
  strong_yes: "Strong yes",
  yes: "Yes",
  hold: "Hold",
  no: "No",
  strong_no: "Strong no",
};

const RECOMMENDATION_VARIANTS: Record<ScorecardRecommendation, "default" | "secondary" | "destructive" | "outline" | "success"> = {
  strong_yes: "success",
  yes: "default",
  hold: "secondary",
  no: "destructive",
  strong_no: "destructive",
};

export function ScorecardList({ applicationId }: { applicationId: string }) {
  const scorecards = useScorecardsForApplication(applicationId);

  if (scorecards.length === 0) {
    return (
      <Card className="border-border shadow-card">
        <CardContent className="py-8 text-center">
          <p className="text-sm text-muted-foreground">No scorecards submitted yet.</p>
          <p className="text-xs text-muted-foreground mt-1">Submit the first scorecard using the form below.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="border-border shadow-card">
        <CardHeader>
          <CardTitle className="text-base">Submitted scorecards ({scorecards.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[300px]">
            <div className="divide-y divide-border p-4">
              {scorecards.map((sc) => (
                <div key={sc.id} className="space-y-3 pb-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={RECOMMENDATION_VARIANTS[sc.recommendation] as any}>
                        {RECOMMENDATION_LABELS[sc.recommendation]}
                      </Badge>
                      {sc.overallScore !== null && (
                        <Badge variant="outline" className="font-mono">
                          {sc.overallScore}/10
                        </Badge>
                      )}
                    </div>
                    <time className="text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(sc.submittedAt), "PPp")}
                    </time>
                  </div>
                  {sc.notes && (
                    <p className="text-sm text-foreground/80 ml-2 border-l-2 border-muted pl-3">{sc.notes}</p>
                  )}
                  {sc.competencies && Object.keys(sc.competencies).length > 0 && (
                    <div className="flex flex-wrap gap-1 ml-2">
                      {Object.entries(sc.competencies).map(([key, value]) => (
                        <Badge key={key} variant="outline" className="text-xs">
                          {key.replace(/_/g, " ")}: {String(value)}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground ml-2">Submitted by: {sc.reviewerId}</p>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}