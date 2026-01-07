import type { IssueStatus } from "./issue";

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
