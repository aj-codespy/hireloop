"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { EligibilityRule, JobRole } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function JobForm({ job }: { job?: JobRole }) {
  const [title, setTitle] = useState(job?.title ?? "");
  const [description, setDescription] = useState(job?.description ?? "");
  const [passingScore, setPassingScore] = useState(String(job?.passingScore ?? 7));
  const [status, setStatus] = useState(job?.status ?? "draft");
  const [rules, setRules] = useState<EligibilityRule[]>(
    job?.eligibilityRules ?? [
      { fieldKey: "grad_score", label: "Graduation %", operator: ">=", value: 60 },
    ]
  );

  function addRule() {
    setRules((prev) => [
      ...prev,
      { fieldKey: "field", label: "New rule", operator: ">=", value: 0 },
    ]);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    toast.success(job ? "Job role updated (demo)" : "Job role created (demo)");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Role details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as JobRole["status"])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="live">Live</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="passing">Passing score (/10)</Label>
              <Input
                id="passing"
                type="number"
                step="0.1"
                value={passingScore}
                onChange={(e) => setPassingScore(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Eligibility rules</CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={addRule}>
            Add rule
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Hard filters applied on application submit. No AI call — pure rule evaluation.
          </p>
          {rules.map((rule, i) => (
            <div key={i} className="grid gap-2 rounded-lg border border-border p-3 sm:grid-cols-4">
              <Input
                value={rule.label}
                onChange={(e) => {
                  const next = [...rules];
                  next[i] = { ...rule, label: e.target.value };
                  setRules(next);
                }}
                placeholder="Label"
              />
              <Input
                value={rule.fieldKey}
                onChange={(e) => {
                  const next = [...rules];
                  next[i] = { ...rule, fieldKey: e.target.value };
                  setRules(next);
                }}
                placeholder="field_key"
              />
              <Select
                value={rule.operator}
                onValueChange={(v) => {
                  const next = [...rules];
                  next[i] = { ...rule, operator: v as EligibilityRule["operator"] };
                  setRules(next);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="<=">&le;</SelectItem>
                  <SelectItem value=">=">&ge;</SelectItem>
                  <SelectItem value="=">=</SelectItem>
                </SelectContent>
              </Select>
              <Input
                value={String(rule.value)}
                onChange={(e) => {
                  const next = [...rules];
                  next[i] = { ...rule, value: e.target.value };
                  setRules(next);
                }}
                placeholder="Value"
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button type="submit" className="rounded-full bg-brand hover:bg-brand/90">
          {job ? "Save changes" : "Create role"}
        </Button>
      </div>
    </form>
  );
}
