"use client";

import { useMemo } from "react";
import { PhosphorIcon } from "@/components/icons/phosphor-icon";
import type { EligibilityRule } from "@/lib/types";
import { cn } from "@/lib/utils";

interface EligibilityPreviewProps {
  rules: EligibilityRule[];
  formValues: Record<string, string | number | File | null | undefined>;
  className?: string;
}

function evaluateRule(
  rule: EligibilityRule,
  value: string | number | undefined | null,
): boolean {
  if (value === undefined || value === null || value === "") return false;

  const numVal = typeof value === "number" ? value : parseFloat(String(value));
  const strVal = String(value).toLowerCase();

  switch (rule.operator) {
    case ">=":
      return !isNaN(numVal) && numVal >= (rule.value as number);
    case "<=":
      return !isNaN(numVal) && numVal <= (rule.value as number);
    case ">":
      return !isNaN(numVal) && numVal > (rule.value as number);
    case "<":
      return !isNaN(numVal) && numVal < (rule.value as number);
    case "=":
      return strVal === String(rule.value).toLowerCase();
    default:
      return false;
  }
}

export function EligibilityPreview({
  rules,
  formValues,
  className,
}: EligibilityPreviewProps) {
  const evaluations = useMemo(() => {
    return rules.map((rule) => {
      const rawValue = formValues[rule.fieldKey];
      // File values can't be evaluated against eligibility rules
      const currentValue =
        rawValue instanceof File ? undefined : (rawValue ?? undefined);
      const meetsCondition = evaluateRule(rule, currentValue);
      return { fieldKey: rule.fieldKey, rule, meetsCondition, currentValue };
    });
  }, [rules, formValues]);

  const allMet = evaluations.every((e) => e.meetsCondition);
  const someMet = evaluations.some((e) => e.meetsCondition);

  if (rules.length === 0) return null;

  // Icon and text color
  const iconName = allMet ? "CheckCircle" : someMet ? "Warning" : "Circle";

  return (
    <section
      className={cn("rounded-2xl border border-stone-200 bg-stone-50 p-4", className)}
      aria-live="polite"
    >
      <div className="space-y-4">
        <div className="flex items-start gap-2">
          <PhosphorIcon
            name={iconName}
            className={cn(
              "h-5 w-5 shrink-0 mt-0.5",
              allMet
                ? "text-emerald-700"
                : someMet
                ? "text-amber-700"
                : "text-slate-500",
            )}
            aria-hidden
          />
          <div>
            <p
              className={cn(
                "text-sm font-medium",
                allMet
                  ? "text-emerald-900"
                  : someMet
                  ? "text-amber-900"
                  : "text-slate-900",
              )}
            >
              {allMet
                ? "You meet the eligibility criteria"
                : someMet
                ? "Some eligibility criteria not met"
                : "Complete the fields to check eligibility"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {allMet
                ? "If you proceed, you'll receive an interview link after submitting."
                : "Review the requirements below before submitting your application."}
            </p>
          </div>
        </div>

        <div className="divide-y divide-stone-200 border-t border-stone-200">
          {evaluations.map((ev) => (
            <div key={ev.rule.fieldKey} className="flex items-start gap-3 py-3">
              {ev.meetsCondition ? (
                <PhosphorIcon
                  name="CheckCircle"
                  className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700"
                />
              ) : (
                <PhosphorIcon
                  name="Circle"
                  className="mt-0.5 h-4 w-4 shrink-0 text-slate-400"
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium">{ev.rule.label}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {ev.meetsCondition
                    ? "Requirement satisfied"
                    : `Requires ${ev.rule.operator} ${ev.rule.value}`}
                </p>
              </div>
              <span className="text-[10px] text-muted-foreground shrink-0">
                {ev.currentValue != null ? String(ev.currentValue) : "Not provided"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}