import type { Issue } from "../types";
import { parseJQL } from "./parse";

export const executeJQL = (jql: string, issues: Issue[]): Issue[] => {
  try {
    const clauses = parseJQL(jql);
    if (clauses.length === 0) return issues;
    return issues.filter((issue) => {
      return clauses.every(({ field, value }) => {
        return (
          String((issue as unknown as Record<string, unknown>)[field]) === value
        );
      });
    });
  } catch (e) {
    return issues;
  }
};
