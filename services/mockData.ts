import { Issue, Project, User, Sprint, Notification, IssueStatus } from '../types';

// --- Users ---
export const USERS: User[] = [
  { id: 'u1', name: 'Alice Engineer', avatarUrl: 'https://picsum.photos/seed/u1/200' },
  { id: 'u2', name: 'Bob Manager', avatarUrl: 'https://picsum.photos/seed/u2/200' },
  { id: 'u3', name: 'Charlie Designer', avatarUrl: 'https://picsum.photos/seed/u3/200' },
  { id: 'u4', name: 'Dave QA', avatarUrl: 'https://picsum.photos/seed/u4/200' },
];

export const CURRENT_USER_ID = 'u1';

// --- Projects ---
export const PROJECTS: Project[] = [
  {
    id: 'p1',
    key: 'WEB',
    name: 'Web Platform Revamp',
    description: 'Modernizing the legacy web application stack.',
    leadId: 'u2',
    category: 'Software',
    type: 'Scrum',
    iconUrl: '🚀'
  },
  {
    id: 'p2',
    key: 'MOB',
    name: 'Mobile App V2',
    description: 'Next generation mobile experience.',
    leadId: 'u1',
    category: 'Software',
    type: 'Kanban',
    iconUrl: '📱'
  },
  {
    id: 'p3',
    key: 'MKT',
    name: 'Q3 Marketing Campaign',
    description: 'Global outreach for Q3.',
    leadId: 'u3',
    category: 'Business',
    type: 'Kanban',
    iconUrl: '📈'
  }
];

// --- Sprints ---
export const SPRINTS: Sprint[] = [
  { id: 's1', projectId: 'p1', name: 'WEB Sprint 23', status: 'active', startDate: '2023-10-01', endDate: '2023-10-14', goal: 'Fix critical bugs' },
  { id: 's2', projectId: 'p1', name: 'WEB Sprint 24', status: 'future', goal: 'Feature development' },
  { id: 's3', projectId: 'p1', name: 'WEB Backlog', status: 'future' }, // Virtual sprint container
];

// --- Issues ---
let issues: Issue[] = [
  {
    id: 'i1', key: 'WEB-101', projectId: 'p1', title: 'Implement new login flow', type: 'Story', status: 'In Progress', priority: 'High',
    assigneeId: 'u1', reporterId: 'u2', sprintId: 's1', storyPoints: 5, labels: ['auth', 'frontend'],
    description: 'We need to update the login screen to support SSO.',
    comments: [], createdAt: '2023-10-01', updatedAt: '2023-10-02'
  },
  {
    id: 'i2', key: 'WEB-102', projectId: 'p1', title: 'Fix CSS z-index issue on modal', type: 'Bug', status: 'To Do', priority: 'Medium',
    assigneeId: 'u3', reporterId: 'u4', sprintId: 's1', storyPoints: 2, labels: ['css', 'ui'],
    description: 'Modal covers the navigation bar on mobile.',
    comments: [], createdAt: '2023-10-03', updatedAt: '2023-10-03'
  },
  {
    id: 'i3', key: 'WEB-103', projectId: 'p1', title: 'Backend API for User Profile', type: 'Task', status: 'Done', priority: 'High',
    assigneeId: 'u1', reporterId: 'u2', sprintId: 's1', storyPoints: 8, labels: ['api', 'backend'],
    comments: [], createdAt: '2023-09-28', updatedAt: '2023-10-01'
  },
  {
    id: 'i4', key: 'WEB-104', projectId: 'p1', title: 'Design System Update', type: 'Story', status: 'To Do', priority: 'Low',
    assigneeId: 'u3', reporterId: 'u2', sprintId: 's2', storyPoints: 3, labels: ['design'],
    comments: [], createdAt: '2023-10-05', updatedAt: '2023-10-05'
  },
  {
    id: 'i5', key: 'MOB-55', projectId: 'p2', title: 'Crash on startup iOS 17', type: 'Bug', status: 'In Review', priority: 'Highest',
    assigneeId: 'u1', reporterId: 'u4', storyPoints: 0, labels: ['ios', 'crash'],
    comments: [], createdAt: '2023-10-06', updatedAt: '2023-10-07'
  },
  {
    id: 'i6', key: 'MOB-56', projectId: 'p2', title: 'Add dark mode support', type: 'Story', status: 'To Do', priority: 'Medium',
    assigneeId: undefined, reporterId: 'u3', storyPoints: 5, labels: ['ui'],
    comments: [], createdAt: '2023-10-06', updatedAt: '2023-10-06'
  },
  {
    id: 'i7', key: 'WEB-105', projectId: 'p1', title: 'Research new graph library', type: 'Task', status: 'To Do', priority: 'Low',
    assigneeId: 'u1', reporterId: 'u1', sprintId: 's3', storyPoints: 2, labels: [],
    comments: [], createdAt: '2023-10-08', updatedAt: '2023-10-08'
  }
];

// --- Notifications ---
export const NOTIFICATIONS: Notification[] = [
  { id: 'n1', title: 'Bob assigned you to WEB-101', description: 'Implement new login flow', read: false, createdAt: '2023-10-01T10:00:00', type: 'assignment' },
  { id: 'n2', title: 'Dave commented on MOB-55', description: '"I can reproduce this on iPhone 13"', read: true, createdAt: '2023-10-07T14:30:00', type: 'mention' },
];

// --- Service Functions ---

export const getProjects = () => PROJECTS;
export const getProjectById = (id: string) => PROJECTS.find(p => p.id === id);

export const getIssues = (projectId?: string) => {
  if (projectId) return issues.filter(i => i.projectId === projectId);
  return issues;
};

export const getIssueById = (id: string) => issues.find(i => i.id === id);

export const getIssuesForUser = (userId: string) => issues.filter(i => i.assigneeId === userId);

export const getSprints = (projectId: string) => SPRINTS.filter(s => s.projectId === projectId);

export const updateIssueStatus = (issueId: string, status: IssueStatus) => {
  issues = issues.map(i => i.id === issueId ? { ...i, status } : i);
  return issues.find(i => i.id === issueId);
};

export const getUserById = (id?: string) => USERS.find(u => u.id === id);

export const getCurrentUser = () => USERS.find(u => u.id === CURRENT_USER_ID);

export const createIssue = (issue: Partial<Issue>) => {
  const newId = `i${Date.now()}`;
  const project = PROJECTS.find(p => p.id === issue.projectId);
  const key = `${project?.key}-${Math.floor(Math.random() * 1000)}`;
  
  const newIssue: Issue = {
    id: newId,
    key: key,
    projectId: issue.projectId!,
    title: issue.title || 'Untitled',
    type: issue.type || 'Task',
    status: 'To Do',
    priority: issue.priority || 'Medium',
    assigneeId: issue.assigneeId,
    reporterId: CURRENT_USER_ID,
    labels: [],
    comments: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...issue
  } as Issue;

  issues.push(newIssue);
  return newIssue;
};