import { Issue, Project, User, Sprint, Notification, IssueStatus, IssuePriority, IssueType, Version } from '../types';

// --- Translation Maps ---
export const STATUS_LABELS: Record<IssueStatus, string> = {
  'To Do': '未着手',
  'In Progress': '進行中',
  'In Review': 'レビュー中',
  'Done': '完了'
};

export const PRIORITY_LABELS: Record<IssuePriority, string> = {
  'Highest': '最高',
  'High': '高',
  'Medium': '中',
  'Low': '低',
  'Lowest': '最低'
};

export const TYPE_LABELS: Record<IssueType, string> = {
  'Story': 'ストーリー',
  'Bug': 'バグ',
  'Task': 'タスク',
  'Epic': 'エピック'
};

export const CATEGORY_LABELS: Record<string, string> = {
  'Software': 'ソフトウェア',
  'Business': 'ビジネス'
};

// --- Users ---
export const USERS: User[] = [
  { id: 'u1', name: 'Alice Engineer', avatarUrl: 'https://picsum.photos/seed/u1/200' },
  { id: 'u2', name: 'Bob Manager', avatarUrl: 'https://picsum.photos/seed/u2/200' },
  { id: 'u3', name: 'Charlie Designer', avatarUrl: 'https://picsum.photos/seed/u3/200' },
  { id: 'u4', name: 'Dave QA', avatarUrl: 'https://picsum.photos/seed/u4/200' },
];

export const CURRENT_USER_ID = 'u1';

// --- Projects ---
export let PROJECTS: Project[] = [
  {
    id: 'p1',
    key: 'WEB',
    name: 'Webプラットフォーム刷新',
    description: 'レガシーなWebアプリケーションスタックのモダナイゼーション。',
    leadId: 'u2',
    category: 'Software',
    type: 'Scrum',
    iconUrl: '🚀'
  },
  {
    id: 'p2',
    key: 'MOB',
    name: 'モバイルアプリ V2',
    description: '次世代のモバイル体験を提供するための開発。',
    leadId: 'u1',
    category: 'Software',
    type: 'Kanban',
    iconUrl: '📱'
  },
  {
    id: 'p3',
    key: 'MKT',
    name: 'Q3 マーケティングキャンペーン',
    description: '第3四半期に向けたグローバルな展開計画。',
    leadId: 'u3',
    category: 'Business',
    type: 'Kanban',
    iconUrl: '📈'
  }
];

// --- Sprints ---
export let SPRINTS: Sprint[] = [
  { id: 's1', projectId: 'p1', name: 'WEB スプリント 23', status: 'active', startDate: '2023-10-01', endDate: '2023-10-14', goal: '重大なバグの修正' },
  { id: 's2', projectId: 'p1', name: 'WEB スプリント 24', status: 'future', goal: '機能開発' },
  { id: 's3', projectId: 'p1', name: 'WEB バックログ', status: 'future' }, // Virtual sprint container
];

// --- Versions (Releases) ---
export const VERSIONS: Version[] = [
  { id: 'v1', projectId: 'p1', name: 'v1.0.0', status: 'released', releaseDate: '2023-09-01' },
  { id: 'v2', projectId: 'p1', name: 'v1.1.0', status: 'unreleased', releaseDate: '2023-10-31', description: 'パフォーマンス改善リリース' },
  { id: 'v3', projectId: 'p2', name: 'v2.0 Beta', status: 'unreleased', releaseDate: '2023-11-15' },
];

// --- Issues ---
let issues: Issue[] = [
  {
    id: 'i1', key: 'WEB-101', projectId: 'p1', title: '新しいログインフローの実装', type: 'Story', status: 'In Progress', priority: 'High',
    assigneeId: 'u1', reporterId: 'u2', sprintId: 's1', fixVersionId: 'v2', storyPoints: 5, labels: ['auth', 'frontend'],
    description: 'SSOをサポートするためにログイン画面を更新する必要があります。',
    comments: [], createdAt: '2023-10-01', updatedAt: '2023-10-02'
  },
  {
    id: 'i2', key: 'WEB-102', projectId: 'p1', title: 'モーダルのCSS z-index問題を修正', type: 'Bug', status: 'To Do', priority: 'Medium',
    assigneeId: 'u3', reporterId: 'u4', sprintId: 's1', fixVersionId: 'v2', storyPoints: 2, labels: ['css', 'ui'],
    description: 'モバイルでモーダルがナビゲーションバーを覆ってしまっています。',
    comments: [], createdAt: '2023-10-03', updatedAt: '2023-10-03', dueDate: '2023-10-20'
  },
  {
    id: 'i3', key: 'WEB-103', projectId: 'p1', title: 'ユーザープロファイル用バックエンドAPI', type: 'Task', status: 'Done', priority: 'High',
    assigneeId: 'u1', reporterId: 'u2', sprintId: 's1', fixVersionId: 'v1', storyPoints: 8, labels: ['api', 'backend'],
    comments: [], createdAt: '2023-09-28', updatedAt: '2023-10-01'
  },
  {
    id: 'i4', key: 'WEB-104', projectId: 'p1', title: 'デザインシステムの更新', type: 'Story', status: 'To Do', priority: 'Low',
    assigneeId: 'u3', reporterId: 'u2', sprintId: 's2', storyPoints: 3, labels: ['design'],
    comments: [], createdAt: '2023-10-05', updatedAt: '2023-10-05', dueDate: '2023-10-25'
  },
  {
    id: 'i5', key: 'MOB-55', projectId: 'p2', title: 'iOS 17での起動時クラッシュ', type: 'Bug', status: 'In Review', priority: 'Highest',
    assigneeId: 'u1', reporterId: 'u4', fixVersionId: 'v3', storyPoints: 0, labels: ['ios', 'crash'],
    comments: [], createdAt: '2023-10-06', updatedAt: '2023-10-07'
  },
  {
    id: 'i6', key: 'MOB-56', projectId: 'p2', title: 'ダークモード対応の追加', type: 'Story', status: 'To Do', priority: 'Medium',
    assigneeId: undefined, reporterId: 'u3', fixVersionId: 'v3', storyPoints: 5, labels: ['ui'],
    comments: [], createdAt: '2023-10-06', updatedAt: '2023-10-06'
  },
  {
    id: 'i7', key: 'WEB-105', projectId: 'p1', title: '新しいグラフライブラリの調査', type: 'Task', status: 'To Do', priority: 'Low',
    assigneeId: 'u1', reporterId: 'u1', sprintId: 's3', storyPoints: 2, labels: [],
    comments: [], createdAt: '2023-10-08', updatedAt: '2023-10-08', dueDate: '2023-10-15'
  }
];

// --- Notifications ---
let notifications: Notification[] = [
  { id: 'n1', title: 'BobがあなたをWEB-101に割り当てました', description: '新しいログインフローの実装', read: false, createdAt: '2023-10-01T10:00:00', type: 'assignment', issueId: 'i1' },
  { id: 'n2', title: 'DaveがMOB-55にコメントしました', description: '"iPhone 13で再現できました"', read: true, createdAt: '2023-10-07T14:30:00', type: 'mention', issueId: 'i5' },
];

// --- Service Functions ---

export const getProjects = () => PROJECTS;
export const getProjectById = (id: string) => PROJECTS.find(p => p.id === id);

export const updateProject = (id: string, updates: Partial<Project>) => {
  PROJECTS = PROJECTS.map(p => p.id === id ? { ...p, ...updates } : p);
  return PROJECTS.find(p => p.id === id);
};

export const createProject = (project: Partial<Project>) => {
  const newProject: Project = {
    id: `p${Date.now()}`,
    key: project.key || 'NEW',
    name: project.name || '新しいプロジェクト',
    description: project.description || '',
    leadId: CURRENT_USER_ID,
    category: project.category || 'Software',
    type: project.type || 'Kanban',
    iconUrl: project.iconUrl || '📦',
    ...project
  } as Project;
  
  PROJECTS.push(newProject);
  return newProject;
};

export const getIssues = (projectId?: string) => {
  if (projectId) return issues.filter(i => i.projectId === projectId);
  return issues;
};

export const getIssueById = (id: string) => issues.find(i => i.id === id);

export const getIssuesForUser = (userId: string) => issues.filter(i => i.assigneeId === userId);

export const getSprints = (projectId: string) => SPRINTS.filter(s => s.projectId === projectId);

export const createSprint = (projectId: string) => {
  const projectSprints = SPRINTS.filter(s => s.projectId === projectId);
  const nextNumber = projectSprints.length + 1;
  const project = PROJECTS.find(p => p.id === projectId);
  
  const newSprint: Sprint = {
    id: `s${Date.now()}`,
    projectId,
    name: `${project?.key || 'SPRINT'} スプリント ${nextNumber}`,
    status: 'future'
  };
  
  // Insert before the last item (Backlog container) if exists, or append
  const backlogIndex = SPRINTS.findIndex(s => s.projectId === projectId && s.name.includes('バックログ'));
  if (backlogIndex >= 0) {
      SPRINTS.splice(backlogIndex, 0, newSprint);
  } else {
      SPRINTS.push(newSprint);
  }
  return newSprint;
};

export const getVersions = (projectId: string) => VERSIONS.filter(v => v.projectId === projectId);

export const getNotifications = () => notifications;

export const getUnreadMentionCount = () => {
  return notifications.filter(n => !n.read && n.type === 'mention').length;
};

export const markAllNotificationsRead = () => {
  notifications = notifications.map(n => ({ ...n, read: true }));
  return notifications;
};

export const updateIssueStatus = (issueId: string, status: IssueStatus) => {
  issues = issues.map(i => i.id === issueId ? { ...i, status } : i);
  return issues.find(i => i.id === issueId);
};

export const addComment = (issueId: string, content: string) => {
  const issue = issues.find(i => i.id === issueId);
  if (issue) {
    const newComment = {
      id: `c${Date.now()}`,
      authorId: CURRENT_USER_ID,
      content,
      createdAt: new Date().toISOString()
    };
    issue.comments.push(newComment);
    return issue;
  }
  return null;
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
    title: issue.title || '無題',
    type: issue.type || 'Task',
    status: issue.status || 'To Do',
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
