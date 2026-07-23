"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import type { EligibilityRule } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface EligibilityEvaluator {
  fieldKey: string;
  rule: EligibilityRule;
  meetsCondition: boolean;
  currentValue: string | number | undefined;
}

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
  const IconComponent = allMet
    ? CheckCircle2
    : someMet
      ? AlertTriangle
      : XCircle;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={className}
    >
      <Card
        className={cn(
          "border",
          allMet
            ? "border-emerald-300 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/20"
            : someMet
              ? "border-amber-300 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20"
              : "border-red-300 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20",
        )}
      >
        <CardContent className="space-y-3 p-4">
          {/* Summary */}
          <div className="flex items-start gap-2">
            <IconComponent
              className={cn(
                "h-5 w-5 shrink-0 mt-0.5",
                allMet
                  ? "text-emerald-600 dark:text-emerald-400"
                  : someMet
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-red-600 dark:text-red-400",
              )}
              aria-hidden
            />
            <div>
              <p
                className={cn(
                  "text-sm font-medium",
                  allMet
                    ? "text-emerald-800 dark:text-emerald-200"
                    : someMet
                      ? "text-amber-800 dark:text-amber-200"
                      : "text-red-800 dark:text-red-200",
                )}
              >
                {allMet
                  ? "You meet the eligibility criteria"
                  : someMet
                    ? "Some eligibility criteria not met"
                    : "Eligibility criteria not met"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {allMet
                  ? "If you proceed, you'll receive an interview link after submitting."
                  : "Review the requirements below before submitting your application."}
              </p>
            </div>
          </div>

          {/* Rules */}
          <div className="space-y-2">
            {evaluations.map((ev) => (
              <motion.div
                key={ev.rule.fieldKey}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-start gap-2 rounded-lg bg-background/60 p-2.5"
              >
                {ev.meetsCondition ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
                ) : (
                  <XCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium">
                    {ev.rule.label}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {ev.meetsCondition
                      ? "✓ Requirement satisfied"
                      : `Requires ${ev.rule.operator} ${ev.rule.value}${
                          typeof ev.rule.value === "number" ? "" : ""
                        }`}
                  </p>
                </div>
                <span className="text-[10px] text-muted-foreground shrink-0">
                  {ev.currentValue != null ? String(ev.currentValue) : "—"}
                </span>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}