"use client";

import { useState } from "react";
import type { ApplicationFormField, EligibilityRule } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { PhosphorIcon } from "@/components/icons/phosphor-icon";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function JobRulesEditor({
  formFields,
  eligibilityRules: initialRules,
  passingScore: initialPassing,
  onSave,
  onCancel,
}: {
  formFields: ApplicationFormField[];
  eligibilityRules: EligibilityRule[];
  passingScore: number | null;
  onSave: (rules: EligibilityRule[], passingScore: number | null) => void;
  onCancel?: () => void;
}) {
  const [rules, setRules] = useState(initialRules);
  const [usePassingScore, setUsePassingScore] = useState(initialPassing != null);
  const [passingScore, setPassingScore] = useState(
    initialPassing != null ? String(initialPassing) : "7.0"
  );

  const [prevInitialRules, setPrevInitialRules] = useState(initialRules);
  const [prevInitialPassing, setPrevInitialPassing] = useState(initialPassing);

  if (initialRules !== prevInitialRules || initialPassing !== prevInitialPassing) {
    setPrevInitialRules(initialRules);
    setPrevInitialPassing(initialPassing);
    setRules(initialRules);
    setUsePassingScore(initialPassing != null);
    setPassingScore(initialPassing != null ? String(initialPassing) : "7.0");
  }

  function addRule() {
    const first = formFields[0];
    setRules((prev) => [
      ...prev,
      {
        fieldKey: first?.fieldKey ?? "field",
        label: first?.label ?? "Field",
        operator: ">=",
        value: 0,
      },
    ]);
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Eligibility rules</p>
            <p className="text-sm text-muted-foreground">Optional &mdash; auto-reject on apply if rules fail.</p>
          </div>
          <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={addRule}>
            Add rule
          </Button>
        </div>
        {rules.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No rules configured.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {rules.map((rule, i) => (
              <div key={i} className="grid gap-2 sm:grid-cols-4">
                <Select
                  value={rule.fieldKey}
                  onValueChange={(v) => {
                    if (!v) return;
                    const f = formFields.find((x) => x.fieldKey === v);
                    const next = [...rules];
                    next[i] = { ...rule, fieldKey: v, label: f?.label ?? v };
                    setRules(next);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {formFields.map((f) => (
                      <SelectItem key={f.id} value={f.fieldKey}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={rule.operator}
                  onValueChange={(v) => {
                    if (!v) return;
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
                />
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setRules((prev) => prev.filter((_, j) => j !== i))}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-lg border border-border p-4">
        <div className="flex items-center gap-3">
          <Checkbox
            id="edit-use-passing"
            checked={usePassingScore}
            onCheckedChange={(c) => setUsePassingScore(!!c)}
          />
          <Label htmlFor="edit-use-passing">Require minimum AI interview score to pass</Label>
        </div>
        {usePassingScore ? (
          <div className="mt-3 flex items-center gap-2">
            <Input
              type="number"
              step="0.1"
              className="w-24"
              value={passingScore}
              onChange={(e) => setPassingScore(e.target.value)}
            />
            <span className="text-sm text-muted-foreground">/ 10</span>
          </div>
        ) : null}
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          className="rounded-full bg-brand hover:bg-brand/90"
          onClick={() =>
            onSave(rules, usePassingScore ? Number(passingScore) : null)
          }
        >
          Save rules & thresholds
        </Button>
        {onCancel ? (
          <Button type="button" variant="outline" className="rounded-full" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
      </div>
    </div>
  );
}
