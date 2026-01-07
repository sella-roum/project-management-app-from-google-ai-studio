import type { AutomationLog, Issue } from "../types";

export const evaluateAutomationCondition = (
  condition: string,
  issue: Issue,
): boolean => {
  if (!condition) return true;
  const parts = condition.split(" ");
  if (parts.length === 3) {
    const [field, op, value] = parts;
    const actual = (issue as Record<string, unknown>)[field];
    if (op === "=") return String(actual) === value;
    if (op === "!=") return String(actual) !== value;
  }
  return true;
};

export const sortAutomationLogsByExecutedAt = (
  logs: AutomationLog[],
): AutomationLog[] => {
  return [...logs].sort((a, b) => b.executedAt.localeCompare(a.executedAt));
};
