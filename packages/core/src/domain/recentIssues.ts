import type { Issue, ViewHistory } from "../types";

export const selectRecentIssues = (
  history: ViewHistory[],
  issues: Issue[],
  limit = 10,
): Issue[] => {
  const recentHistory = [...history]
    .sort((a, b) => b.viewedAt.localeCompare(a.viewedAt))
    .slice(0, limit);

  const issueMap = new Map(issues.map((issue) => [issue.id, issue]));

  return recentHistory
    .map((entry) => issueMap.get(entry.issueId))
    .filter(Boolean) as Issue[];
};
