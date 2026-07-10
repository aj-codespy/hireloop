import type { EligibilityRule, FormResponseValue } from "@/lib/types";
import { isApplicationDocument } from "@/lib/form-fields";

export interface EligibilityResult {
  passed: boolean;
  failures: { rule: EligibilityRule; actual: string | number }[];
}

function compare(
  actual: number,
  operator: EligibilityRule["operator"],
  expected: number
): boolean {
  switch (operator) {
    case "<=":
      return actual <= expected;
    case ">=":
      return actual >= expected;
    case "<":
      return actual < expected;
    case ">":
      return actual > expected;
    case "=":
      return actual === expected;
    default:
      return true;
  }
}

export function evaluateEligibility(
  formResponse: Record<string, FormResponseValue>,
  rules: EligibilityRule[]
): EligibilityResult {
  if (rules.length === 0) {
    return { passed: true, failures: [] };
  }

  const failures: EligibilityResult["failures"] = [];

  for (const rule of rules) {
    const raw = formResponse[rule.fieldKey];
    if (isApplicationDocument(raw)) continue;
    if (raw === undefined || raw === "") {
      failures.push({ rule, actual: "—" });
      continue;
    }

    const expected = Number(rule.value);
    const actual = Number(raw);

    if (Number.isNaN(actual) || Number.isNaN(expected)) {
      if (String(raw) !== String(rule.value)) {
        failures.push({ rule, actual: raw });
      }
      continue;
    }

    if (!compare(actual, rule.operator, expected)) {
      failures.push({ rule, actual: raw });
    }
  }

  return { passed: failures.length === 0, failures };
}
