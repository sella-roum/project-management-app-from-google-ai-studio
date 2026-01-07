export interface AutomationRule {
  id: string;
  projectId: string;
  name: string;
  description: string;
  trigger: "issue_created" | "status_changed" | "comment_added";
  condition: string;
  action: "assign_reporter" | "add_comment" | "set_priority_high";
  enabled: boolean;
  lastRun?: string;
}

export interface AutomationLog {
  id: string;
  ruleId: string;
  status: "success" | "failure";
  message: string;
  executedAt: string;
}
