export const DEFAULT_NOTIFICATION_SCHEME: Record<string, string[]> = {
  issue_created: ["Reporter", "Assignee", "Watcher"],
  issue_updated: ["Assignee", "Watcher"],
  issue_assigned: ["Assignee"],
  comment_added: ["Reporter", "Assignee", "Watcher"],
  issue_resolved: ["Reporter", "Watcher"],
};
