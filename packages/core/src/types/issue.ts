export type IssueType = "Story" | "Bug" | "Task" | "Epic";
export type IssuePriority = "Highest" | "High" | "Medium" | "Low" | "Lowest";
export type IssueStatus = "To Do" | "In Progress" | "In Review" | "Done";
export type LinkType = "blocks" | "is blocked by" | "duplicates" | "relates to";

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

export interface IssueLink {
  id: string;
  type: LinkType;
  outwardIssueId: string;
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
