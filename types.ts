export type IssueType = 'Story' | 'Bug' | 'Task' | 'Epic';
export type IssuePriority = 'Highest' | 'High' | 'Medium' | 'Low' | 'Lowest';
export type IssueStatus = 'To Do' | 'In Progress' | 'In Review' | 'Done';

export interface User {
  id: string;
  name: string;
  avatarUrl: string;
}

export interface Comment {
  id: string;
  authorId: string;
  content: string;
  createdAt: string;
}

export interface Issue {
  id: string;
  key: string; // e.g., PROJ-123
  projectId: string;
  title: string;
  type: IssueType;
  status: IssueStatus;
  priority: IssuePriority;
  assigneeId?: string;
  reporterId: string;
  sprintId?: string;
  description?: string;
  dueDate?: string;
  storyPoints?: number;
  labels: string[];
  comments: Comment[];
  createdAt: string;
  updatedAt: string;
  parentId?: string; // For subtasks or linking to Epic
}

export interface Project {
  id: string;
  key: string; // e.g., PROJ
  name: string;
  description: string;
  leadId: string;
  iconUrl?: string; // Emoji or URL
  category: 'Software' | 'Business';
  type: 'Scrum' | 'Kanban';
}

export interface Sprint {
  id: string;
  name: string;
  projectId: string;
  startDate?: string;
  endDate?: string;
  goal?: string;
  status: 'active' | 'future' | 'completed';
}

export interface Notification {
  id: string;
  title: string;
  description: string;
  read: boolean;
  createdAt: string;
  type: 'mention' | 'assignment' | 'system';
}
