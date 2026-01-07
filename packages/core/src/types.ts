export type IssueType = "Story" | "Bug" | "Task" | "Epic";
export type IssuePriority = "Highest" | "High" | "Medium" | "Low" | "Lowest";
export type IssueStatus = "To Do" | "In Progress" | "In Review" | "Done";
export type LinkType = "blocks" | "is blocked by" | "duplicates" | "relates to";

export interface User {
  id: string;
  name: string;
  avatarUrl: string;
  email?: string;
}

export interface Comment {
  id: string;
  authorId: string;
  content: string;
  createdAt: string;
}

export interface WorkLog {
  id: string;
  authorId: string;
  timeSpentSeconds: number;
  comment?: string;
  createdAt: string;
}

export interface Attachment {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  data: string; // base64
  createdAt: string;
}

export interface Issue {
  id: string;
  key: string;
  projectId: string;
  title: string;
  type: IssueType;
  status: IssueStatus;
  priority: IssuePriority;
  assigneeId?: string;
  reporterId: string;
  sprintId?: string;
  fixVersionId?: string;
  description?: string;
  dueDate?: string;
  storyPoints?: number;
  labels: string[];
  comments: Comment[];
  workLogs: WorkLog[];
  history: any[];
  links: IssueLink[];
  attachments: Attachment[];
  createdAt: string;
  updatedAt: string;
  parentId?: string;
  watcherIds: string[];
}

export interface IssueLink {
  id: string;
  type: LinkType;
  outwardIssueId: string;
}

export interface Project {
  id: string;
  key: string;
  name: string;
  description: string;
  leadId: string;
  iconUrl?: string;
  category: "Software" | "Business";
  type: "Scrum" | "Kanban";
  columnSettings?: Record<IssueStatus, { limit?: number }>;
  starred?: boolean;
  workflowSettings?: Record<string, string[]>;
  notificationSettings?: Record<string, string[]>;
}

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

export interface Sprint {
  id: string;
  name: string;
  projectId: string;
  status: "active" | "future" | "completed";
}

export interface Version {
  id: string;
  projectId: string;
  name: string;
  status: "released" | "unreleased" | "archived";
  releaseDate?: string;
}

export interface Notification {
  id: string;
  title: string;
  description: string;
  read: boolean;
  createdAt: string;
  type: "mention" | "assignment" | "system";
  issueId?: string;
}

export interface SavedFilter {
  id: string;
  name: string;
  query: string;
  ownerId: string;
  isFavorite: boolean;
}

export interface ViewHistory {
  id: string;
  userId: string;
  issueId: string;
  viewedAt: string;
}
