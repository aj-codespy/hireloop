"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PhosphorIcon } from "@/components/icons/phosphor-icon";
import type { Question, QuestionSection } from "@/lib/types";
import { SECTION_LABELS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const SECTIONS: QuestionSection[] = ["technical", "situational", "hr"];

export function QuestionBankEditor({
  jobTitle,
  questions: initial,
}: {
  jobTitle: string;
  questions: Question[];
}) {
  const [questions, setQuestions] = useState(initial);

  const bySection = useMemo(() => {
    return SECTIONS.reduce(
      (acc, section) => {
        acc[section] = questions.filter((q) => q.section === section);
        return acc;
      },
      {} as Record<QuestionSection, Question[]>
    );
  }, [questions]);

  function addQuestion(section: QuestionSection) {
    setQuestions((prev) => [
      ...prev,
      {
        id: `new-${prev.length}`,
        questionBankId: `bank-${section}`,
        jobRoleId: prev[0]?.jobRoleId ?? "",
        section,
        promptText: "",
        idealAnswerNotes: "",
        timeLimitSeconds: 75,
        scoreThreshold: null,
        order: prev.filter((q) => q.section === section).length + 1,
        isActive: true,
        isMandatory: false,
      },
    ]);
  }

  function save() {
    toast.success("Question bank saved (demo)");
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
              <strong className="text-foreground">{jobTitle}</strong> &mdash; mandatory technical questions
              are always asked; situational pool picks 2 of N per candidate server-side.
            </div>

      <Tabs defaultValue="technical">
        <TabsList>
          {SECTIONS.map((s) => (
            <TabsTrigger key={s} value={s}>
              {SECTION_LABELS[s]}
              <Badge variant="secondary" className="ml-2">
                {bySection[s].length}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        {SECTIONS.map((section) => (
          <TabsContent key={section} value={section} className="space-y-4">
            {bySection[section].map((q, i) => {
              const idx = questions.findIndex((x) => x.id === q.id);
              return (
                <Card key={q.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">Question {i + 1}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Label className="text-xs">Active</Label>
                        <Switch
                          checked={q.isActive}
                          onCheckedChange={(checked) => {
                            const next = [...questions];
                            next[idx] = { ...q, isActive: checked };
                            setQuestions(next);
                          }}
                        />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-1.5">
                      <Label>Prompt</Label>
                      <Textarea
                        rows={3}
                        value={q.promptText}
                        onChange={(e) => {
                          const next = [...questions];
                          next[idx] = { ...q, promptText: e.target.value };
                          setQuestions(next);
                        }}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Ideal answer notes (scoring only)</Label>
                      <Textarea
                        rows={2}
                        value={q.idealAnswerNotes}
                        onChange={(e) => {
                          const next = [...questions];
                          next[idx] = { ...q, idealAnswerNotes: e.target.value };
                          setQuestions(next);
                        }}
                      />
                    </div>
                    <div className="w-40 space-y-1.5">
                      <Label>Time limit (sec)</Label>
                      <Input
                        type="number"
                        value={q.timeLimitSeconds ?? ""}
                        onChange={(e) => {
                          const next = [...questions];
                          next[idx] = {
                            ...q,
                            timeLimitSeconds: e.target.value ? Number(e.target.value) : null,
                          };
                          setQuestions(next);
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            <Button type="button" variant="outline" onClick={() => addQuestion(section)}>
              <PhosphorIcon name="Plus" className="mr-1 h-4 w-4" />
              Add {SECTION_LABELS[section]} question
            </Button>
          </TabsContent>
        ))}
      </Tabs>

      <div className="flex justify-end">
        <Button onClick={save}>Save question bank</Button>
      </div>
    </div>
  );
}
